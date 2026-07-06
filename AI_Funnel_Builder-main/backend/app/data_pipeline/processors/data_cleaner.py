"""
Data Cleaner - Production Grade Implementation
==============================================
Schema-driven normalization, validation, missing-value handling, and
deduplication for streaming/batch records.

Key capabilities:
- Schema rules: required, types, regex, enums, defaults, transforms, coercion
- Normalization: trim strings, lower/upper casing, safe JSON casts
- Missing handling: drop/keep/fill strategies per field
- Validation: types, formats (email/url/phone), ranges, enumerations
- Deduplication:
  - In-batch deterministic dedup on composite unique keys
  - Cross-batch dedup via Redis Sets (time-bucket keys) or RedisBloom (BF.ADD)
- Metrics and detailed cleaning report
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

try:
    import redis.asyncio as redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # Optional

from app.utils.logger import get_logger
from app.utils.validators import is_valid_email, is_valid_url, is_valid_phone
from app.utils.exceptions import ValidationError
from app.core.config import settings

logger = get_logger(__name__)


# ----------------------------
# Schema rule definitions
# ----------------------------

TransformFn = Callable[[Any], Any]

@dataclass(frozen=True)
class FieldRule:
    name: str
    required: bool = False
    py_type: Optional[type] = None
    allow_null: bool = True
    default: Any = None
    regex: Optional[str] = None
    choices: Optional[List[Any]] = None
    coerce: bool = True
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    transform: Optional[TransformFn] = None
    is_email: bool = False
    is_url: bool = False
    is_phone: bool = False
    is_timestamp: bool = False  # expects ISO8601 or epoch ms

@dataclass(frozen=True)
class DataSchema:
    name: str
    unique_key_fields: Tuple[str, ...] = field(default_factory=tuple)
    fields: Tuple[FieldRule, ...] = field(default_factory=tuple)


@dataclass
class DataCleanerConfig:
    normalize_trim_strings: bool = True
    normalize_collapse_whitespace: bool = True
    normalize_string_case: Optional[str] = None  # 'lower'|'upper'|None
    drop_on_missing_required: bool = True
    drop_on_invalid: bool = True
    dedup_enable_cross_batch: bool = True
    dedup_use_bloom_filter: bool = False  # requires RedisBloom
    dedup_bucket_seconds: int = 3600  # 1 hour rolling buckets for SETs
    dedup_bloom_error_rate: float = 0.001  # if using Bloom
    dedup_bloom_capacity: int = 1_000_000
    hash_salt: str = "dc_v1"
    max_invalid_fields_to_log: int = 5


@dataclass
class CleanStats:
    input_count: int = 0
    kept_count: int = 0
    dropped_missing_required: int = 0
    dropped_invalid: int = 0
    dedup_in_batch: int = 0
    dedup_cross_batch: int = 0

@dataclass
class CleanResult:
    records: List[Dict[str, Any]]
    stats: CleanStats
    warnings: List[str]


class DataCleaner:
    """
    Production data cleaner for streaming/batch processing.

    Usage:
        cleaner = DataCleaner(redis_client=redis_client)
        result = await cleaner.clean_batch(records, schema)
        # result.records -> cleaned & deduped
        # result.stats -> metrics
    """

    def __init__(
        self,
        redis_client: Optional[Any] = None,
        config: Optional[DataCleanerConfig] = None,
    ):
        self.redis = redis_client
        self.cfg = config or DataCleanerConfig()

    # ---------------
    # Public API
    # ---------------

    async def clean_batch(
        self,
        records: Iterable[Dict[str, Any]],
        schema: DataSchema,
    ) -> CleanResult:
        stats = CleanStats()
        warnings: List[str] = []

        # Normalize & validate in one pass; track in-batch dedup keys
        seen_in_batch: set[str] = set()
        cleaned: List[Dict[str, Any]] = []

        for rec in records:
            stats.input_count += 1

            try:
                normalized = self._normalize_record(dict(rec), schema)
                valid, invalid_reasons = self._validate_and_fill(normalized, schema)

                if not valid:
                    if self.cfg.drop_on_invalid:
                        stats.dropped_invalid += 1
                        self._log_invalid(normalized, invalid_reasons, warnings)
                        continue
                    # else keep with warnings
                    self._log_invalid(normalized, invalid_reasons, warnings)

                # In-batch dedup
                dedup_key = self._make_dedup_key(normalized, schema)
                if dedup_key in seen_in_batch:
                    stats.dedup_in_batch += 1
                    continue
                seen_in_batch.add(dedup_key)

                # Cross-batch dedup (Redis)
                if self.cfg.dedup_enable_cross_batch and self.redis:
                    was_dup = await self._cross_batch_dedup(schema, dedup_key)
                    if was_dup:
                        stats.dedup_cross_batch += 1
                        continue

                cleaned.append(normalized)
                stats.kept_count += 1

            except MissingRequiredError:
                if self.cfg.drop_on_missing_required:
                    stats.dropped_missing_required += 1
                    continue
                warnings.append("Record missing required fields; kept due to config.")
                cleaned.append(rec)
                stats.kept_count += 1

            except Exception as e:
                logger.error(f"Unexpected error while cleaning record: {e}", exc_info=True)
                if self.cfg.drop_on_invalid:
                    stats.dropped_invalid += 1
                else:
                    warnings.append(f"Unexpected error; keeping record: {e}")
                    cleaned.append(rec)
                    stats.kept_count += 1

        return CleanResult(records=cleaned, stats=stats, warnings=warnings)

    # ---------------
    # Normalization
    # ---------------

    def _normalize_record(self, rec: Dict[str, Any], schema: DataSchema) -> Dict[str, Any]:
        for rule in schema.fields:
            if rule.name not in rec and rule.default is not None:
                rec[rule.name] = rule.default

            if rule.name in rec:
                val = rec[rule.name]
                # Trim/collapse/case normalize for strings
                if isinstance(val, str):
                    if self.cfg.normalize_trim_strings:
                        val = val.strip()
                    if self.cfg.normalize_collapse_whitespace:
                        val = re.sub(r"\s+", " ", val)
                    if self.cfg.normalize_string_case == "lower":
                        val = val.lower()
                    elif self.cfg.normalize_string_case == "upper":
                        val = val.upper()
                # Timestamp coercion if requested
                if rule.is_timestamp and val is not None:
                    rec[rule.name] = self._coerce_timestamp(val)
                else:
                    rec[rule.name] = val
        return rec

    # ---------------
    # Validation & Missing Handling
    # ---------------

    def _validate_and_fill(
        self, rec: Dict[str, Any], schema: DataSchema
    ) -> Tuple[bool, List[str]]:
        reasons: List[str] = []

        # Required & defaults
        missing_required = [
            fr.name for fr in schema.fields
            if fr.required and (fr.name not in rec or rec[fr.name] is None)
        ]
        if missing_required:
            raise MissingRequiredError(f"Missing required fields: {missing_required}")

        # Field-level validation
        for fr in schema.fields:
            value = rec.get(fr.name, None)

            if value is None:
                if not fr.allow_null and fr.default is None:
                    reasons.append(f"{fr.name}: null not allowed")
                if value is None and fr.default is not None:
                    rec[fr.name] = fr.default
                continue

            # Coerce types
            if fr.py_type and fr.coerce:
                coerced, ok = self._coerce_type(value, fr.py_type)
                if ok:
                    value = coerced
                    rec[fr.name] = value
                else:
                    reasons.append(f"{fr.name}: cannot coerce to {fr.py_type.__name__}")

            # Regex
            if fr.regex and isinstance(value, str):
                if re.fullmatch(fr.regex, value) is None:
                    reasons.append(f"{fr.name}: regex mismatch")

            # Choices
            if fr.choices is not None and value not in fr.choices:
                reasons.append(f"{fr.name}: not in choices")

            # Ranges
            if isinstance(value, (int, float)):
                if fr.min_value is not None and value < fr.min_value:
                    reasons.append(f"{fr.name}: below min")
                if fr.max_value is not None and value > fr.max_value:
                    reasons.append(f"{fr.name}: above max")

            # Format validators
            if fr.is_email and isinstance(value, str) and not is_valid_email(value):
                reasons.append(f"{fr.name}: invalid email")
            if fr.is_url and isinstance(value, str) and not is_valid_url(value):
                reasons.append(f"{fr.name}: invalid url")
            if fr.is_phone and isinstance(value, str) and not is_valid_phone(value):
                reasons.append(f"{fr.name}: invalid phone")

            # Custom transform
            if fr.transform is not None:
                try:
                    rec[fr.name] = fr.transform(rec[fr.name])
                except Exception as e:
                    reasons.append(f"{fr.name}: transform error {e}")

        return (len(reasons) == 0), reasons

    # ---------------
    # Deduplication
    # ---------------

    def _make_dedup_key(self, rec: Dict[str, Any], schema: DataSchema) -> str:
        if not schema.unique_key_fields:
            # Fallback to hash of entire record
            payload = json.dumps(rec, sort_keys=True, default=str)
        else:
            payload_dict = {k: rec.get(k) for k in schema.unique_key_fields}
            payload = json.dumps(payload_dict, sort_keys=True, default=str)
        digest = hashlib.sha256((self.cfg.hash_salt + "|" + payload).encode("utf-8")).hexdigest()
        return f"{schema.name}:{digest}"

    async def _cross_batch_dedup(self, schema: DataSchema, dedup_key: str) -> bool:
        """
        Returns True if record is a duplicate (already seen recently).
        Strategy:
          - If Bloom enabled: BF.ADD -> returns 0 if already present (duplicate)
          - Else: time-bucketed Redis SET with EXPIRE to bound memory
        """
        if not self.redis:
            return False

        now = datetime.now(timezone.utc)
        if self.cfg.dedup_use_bloom_filter:
            # Ensure filter exists; rely on BF.RESERVE, then BF.ADD
            filter_key = f"dc:bf:{schema.name}"
            try:
                # Reserve only once; ignore error if already exists
                await self.redis.execute_command(
                    "BF.RESERVE", filter_key, self.cfg.dedup_bloom_error_rate, self.cfg.dedup_bloom_capacity
                )
            except Exception:
                pass  # Already exists or RedisBloom not available
            try:
                added = await self.redis.execute_command("BF.ADD", filter_key, dedup_key)
                return added == 0  # 0 => probably existed => duplicate
            except Exception:
                # Fallback to SET if Bloom unavailable
                pass

        bucket_start = now - timedelta(seconds=now.second % self.cfg.dedup_bucket_seconds,
                                       microseconds=now.microsecond)
        bucket_key = f"dc:set:{schema.name}:{int(bucket_start.timestamp())}"
        try:
            added = await self.redis.sadd(bucket_key, dedup_key)
            # Ensure expiry on the bucket key
            await self.redis.expire(bucket_key, self.cfg.dedup_bucket_seconds * 2)
            return added == 0  # 0 => already in set => duplicate
        except Exception as e:
            logger.warning(f"Redis dedup fallback disabled due to error: {e}")
            return False

    # ---------------
    # Helpers
    # ---------------

    def _coerce_type(self, value: Any, target: type) -> Tuple[Any, bool]:
        try:
            if target is bool and isinstance(value, str):
                v = value.strip().lower()
                if v in ("true", "1", "yes", "y"): return True, True
                if v in ("false", "0", "no", "n"): return False, True
            if target is dict and isinstance(value, str):
                return json.loads(value), True
            if target in (int, float) and isinstance(value, str):
                v = value.replace(",", "")
                return target(v), True
            if target is str and not isinstance(value, str):
                return str(value), True
            if isinstance(value, target):
                return value, True
            return target(value), True
        except Exception:
            return value, False

    def _coerce_timestamp(self, value: Any) -> Optional[datetime]:
        if value is None or value == "":
            return None
        if isinstance(value, (int, float)):
            # epoch ms or seconds (heuristic)
            if value > 1e12:
                return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
            if value > 1e9:
                return datetime.fromtimestamp(value, tz=timezone.utc)
            return datetime.fromtimestamp(float(value), tz=timezone.utc)
        if isinstance(value, str):
            # Try ISO8601
            try:
                # Python 3.11+ fromisoformat handles 'Z' via replace
                v = value.replace("Z", "+00:00") if value.endswith("Z") else value
                dt = datetime.fromisoformat(v)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except Exception:
                pass
        # Fallback: leave as-is
        return None

    def _log_invalid(self, rec: Dict[str, Any], reasons: List[str], warnings: List[str]) -> None:
        msg = f"Invalid record ({', '.join(reasons[:self.cfg.max_invalid_fields_to_log])})"
        warnings.append(msg)
        logger.debug(msg + f" :: rec={self._safe_sample(rec)}")

    def _safe_sample(self, rec: Dict[str, Any]) -> Dict[str, Any]:
        # Avoid logging sensitive fields
        redacted = {}
        for k, v in rec.items():
            if k.lower() in ("password", "token", "secret", "email"):
                redacted[k] = "***redacted***"
            else:
                redacted[k] = v
        return redacted


# ----------------------------
# Errors
# ----------------------------

class MissingRequiredError(ValidationError):
    pass


# ----------------------------
# Example schemas (optional)
# ----------------------------

EMAIL_REGEX = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

EVENT_SCHEMA = DataSchema(
    name="event",
    unique_key_fields=("session_id", "event_type", "timestamp"),
    fields=(
        FieldRule("event_type", required=True, py_type=str),
        FieldRule("funnel_id", required=False, py_type=int, allow_null=True),
        FieldRule("session_id", required=True, py_type=str),
        FieldRule("user_id", required=False, py_type=int, allow_null=True),
        FieldRule("question_id", required=False, py_type=int, allow_null=True),
        FieldRule("payload", required=True, py_type=dict, coerce=True),
        FieldRule("timestamp", required=True, is_timestamp=True),
        FieldRule("metadata", required=False, py_type=dict, coerce=True, allow_null=True, default={}),
    ),
)

RESPONSE_SCHEMA = DataSchema(
    name="response",
    unique_key_fields=("session_id", "funnel_id", "completed_at"),
    fields=(
        FieldRule("funnel_id", required=True, py_type=int),
        FieldRule("session_id", required=True, py_type=str),
        FieldRule("user_id", required=False, py_type=int, allow_null=True),
        FieldRule("completed_at", required=False, is_timestamp=True, allow_null=True),
        FieldRule("is_completed", required=True, py_type=bool, coerce=True),
        FieldRule("device_type", required=False, py_type=str, allow_null=True),
        FieldRule("channel", required=False, py_type=str, allow_null=True),
        FieldRule("user_agent", required=False, py_type=str, allow_null=True),
        FieldRule("ip_address", required=False, py_type=str, allow_null=True),
        FieldRule("metadata", required=False, py_type=dict, coerce=True, allow_null=True, default={}),
    ),
)
