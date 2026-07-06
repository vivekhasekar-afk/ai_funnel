"""
Anonymizer - Production Grade Implementation
============================================
GDPR-compliant PII anonymization with multiple techniques:
- Hashing (irreversible, for analytics)
- Pseudonymization (reversible, for controlled de-identification)
- Masking (partial/full redaction)
- Generalization (reducing precision)
- Suppression (complete removal)

Designed to handle:
- Email addresses
- Phone numbers
- Names
- IP addresses
- Custom sensitive fields
- User-provided PII across all data pipelines

Key principles:
- Irreversibility for true anonymization (GDPR Article 4)
- Consistency: same input → same output within context
- Auditability: track what was anonymized and how
- Performance: batch operations with caching
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Callable
from collections import defaultdict
import json

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# --------------------------
# Configuration & Enums
# --------------------------

class AnonymizationTechnique(str, Enum):
    """Anonymization techniques per GDPR guidance"""
    HASH = "hash"                      # Irreversible cryptographic hash
    PSEUDONYMIZE = "pseudonymize"      # Reversible with key
    MASK = "mask"                      # Partial/full masking (e.g., ***@***.com)
    GENERALIZE = "generalize"          # Reduce precision (age → age range)
    SUPPRESS = "suppress"              # Complete removal
    REDACT = "redact"                  # Replace with placeholder


class PIIFieldType(str, Enum):
    """Common PII field types for auto-detection"""
    EMAIL = "email"
    PHONE = "phone"
    NAME = "name"
    SSN = "ssn"
    IP_ADDRESS = "ip_address"
    ADDRESS = "address"
    DATE_OF_BIRTH = "date_of_birth"
    CREDIT_CARD = "credit_card"
    CUSTOM = "custom"


@dataclass
class AnonymizationRule:
    """Rule defining how to anonymize a field"""
    field_name: str
    field_type: PIIFieldType
    technique: AnonymizationTechnique
    preserve_format: bool = True        # Keep format for masked values
    preserve_length: bool = False       # Keep length (for testing)
    generalization_level: Optional[int] = None  # For GENERALIZE
    custom_handler: Optional[Callable[[Any], Any]] = None


@dataclass
class AnonymizationConfig:
    """Global anonymization configuration"""
    hash_salt: str = field(default_factory=lambda: secrets.token_hex(32))
    use_hmac: bool = True
    hash_algorithm: str = "sha256"
    pseudonym_key: Optional[bytes] = None  # For Fernet encryption
    consistent_hashing: bool = True        # Same input → same output
    audit_log_enabled: bool = True
    strict_mode: bool = True               # Fail on unrecognized PII


@dataclass
class AnonymizationAudit:
    """Audit record for anonymization operations"""
    timestamp: datetime
    record_id: Optional[str]
    fields_anonymized: List[str]
    technique_used: Dict[str, str]
    reversible: bool


# --------------------------
# Core Anonymizer
# --------------------------

class Anonymizer:
    """
    Production-grade PII anonymizer supporting multiple techniques.
    
    Usage:
        config = AnonymizationConfig(hash_salt="my-secret-salt")
        anonymizer = Anonymizer(config)
        
        rules = [
            AnonymizationRule("email", PIIFieldType.EMAIL, AnonymizationTechnique.HASH),
            AnonymizationRule("phone", PIIFieldType.PHONE, AnonymizationTechnique.MASK),
            AnonymizationRule("ip_address", PIIFieldType.IP_ADDRESS, AnonymizationTechnique.GENERALIZE),
        ]
        
        anonymized = await anonymizer.anonymize_batch(records, rules)
    """
    
    def __init__(self, config: Optional[AnonymizationConfig] = None):
        self.config = config or AnonymizationConfig()
        
        # Hash cache for consistent hashing (session-scoped)
        self._hash_cache: Dict[str, str] = {}
        
        # Pseudonym mapping (reversible, in-memory only for demo)
        self._pseudonym_map: Dict[str, str] = {}
        self._reverse_pseudonym_map: Dict[str, str] = {}
        
        # Initialize encryption if available
        self._cipher: Optional[Any] = None
        if CRYPTO_AVAILABLE and self.config.pseudonym_key:
            self._cipher = Fernet(self.config.pseudonym_key)
        elif not CRYPTO_AVAILABLE:
            logger.warning("cryptography library not available; pseudonymization disabled")
        
        # Audit trail
        self._audit_log: List[AnonymizationAudit] = []
        
        # Regex patterns for PII detection
        self._patterns = {
            PIIFieldType.EMAIL: re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
            PIIFieldType.PHONE: re.compile(r"\+?[1-9]\d{1,14}"),  # E.164 format
            PIIFieldType.IP_ADDRESS: re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
            PIIFieldType.SSN: re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
            PIIFieldType.CREDIT_CARD: re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
        }
    
    # ----------------------
    # Public API
    # ----------------------
    
    async def anonymize_batch(
        self,
        records: List[Dict[str, Any]],
        rules: List[AnonymizationRule],
    ) -> List[Dict[str, Any]]:
        """
        Anonymize a batch of records according to rules.
        
        Returns:
            List of anonymized records
        """
        anonymized: List[Dict[str, Any]] = []
        
        for record in records:
            anon_record = await self.anonymize_record(record, rules)
            anonymized.append(anon_record)
        
        return anonymized
    
    async def anonymize_record(
        self,
        record: Dict[str, Any],
        rules: List[AnonymizationRule],
    ) -> Dict[str, Any]:
        """Anonymize a single record"""
        anonymized = record.copy()
        fields_processed: List[str] = []
        techniques_used: Dict[str, str] = {}
        reversible = False
        
        for rule in rules:
            if rule.field_name not in anonymized:
                continue
            
            original_value = anonymized[rule.field_name]
            if original_value is None:
                continue
            
            # Apply anonymization technique
            if rule.custom_handler:
                anonymized_value = rule.custom_handler(original_value)
            else:
                anonymized_value = await self._apply_technique(
                    original_value, rule
                )
            
            anonymized[rule.field_name] = anonymized_value
            fields_processed.append(rule.field_name)
            techniques_used[rule.field_name] = rule.technique.value
            
            if rule.technique == AnonymizationTechnique.PSEUDONYMIZE:
                reversible = True
        
        # Audit
        if self.config.audit_log_enabled and fields_processed:
            self._audit_log.append(
                AnonymizationAudit(
                    timestamp=datetime.utcnow(),
                    record_id=record.get("id") or record.get("session_id"),
                    fields_anonymized=fields_processed,
                    technique_used=techniques_used,
                    reversible=reversible,
                )
            )
        
        return anonymized
    
    def hash_emails(self, emails: List[str]) -> List[str]:
        """
        Securely hash a list of email addresses.
        Uses HMAC-SHA256 with salt for security.
        
        GDPR-compliant irreversible anonymization.
        """
        return [self._hash_value(email, PIIFieldType.EMAIL) for email in emails]
    
    def detect_pii_fields(
        self,
        record: Dict[str, Any],
        field_types: Optional[List[PIIFieldType]] = None,
    ) -> Dict[str, PIIFieldType]:
        """
        Auto-detect PII fields in a record using regex patterns.
        
        Returns:
            Dict mapping field_name → detected PIIFieldType
        """
        detected: Dict[str, PIIFieldType] = {}
        types_to_check = field_types or list(PIIFieldType)
        
        for field_name, value in record.items():
            if not isinstance(value, str):
                continue
            
            # Check against patterns
            for pii_type in types_to_check:
                if pii_type not in self._patterns:
                    continue
                
                pattern = self._patterns[pii_type]
                if pattern.search(value):
                    detected[field_name] = pii_type
                    break
            
            # Heuristic field name matching
            field_lower = field_name.lower()
            if "email" in field_lower:
                detected[field_name] = PIIFieldType.EMAIL
            elif "phone" in field_lower or "mobile" in field_lower:
                detected[field_name] = PIIFieldType.PHONE
            elif "name" in field_lower and "user" in field_lower:
                detected[field_name] = PIIFieldType.NAME
            elif "ip" in field_lower or "address" in field_lower:
                detected[field_name] = PIIFieldType.IP_ADDRESS
        
        return detected
    
    async def de_anonymize(
        self,
        anonymized_value: str,
        original_field_type: PIIFieldType,
    ) -> Optional[str]:
        """
        Attempt to reverse pseudonymization (if reversible technique was used).
        Only works for PSEUDONYMIZE technique.
        
        Returns:
            Original value if reversible, None otherwise
        """
        if not self._cipher:
            logger.warning("De-anonymization not available without encryption key")
            return None
        
        # Check reverse map
        if anonymized_value in self._reverse_pseudonym_map:
            return self._reverse_pseudonym_map[anonymized_value]
        
        # Try decryption
        try:
            decrypted = self._cipher.decrypt(anonymized_value.encode()).decode()
            return decrypted
        except Exception as e:
            logger.debug(f"Failed to de-anonymize: {e}")
            return None
    
    def get_audit_log(self) -> List[AnonymizationAudit]:
        """Retrieve audit log for compliance reporting"""
        return self._audit_log.copy()
    
    def clear_cache(self):
        """Clear internal caches (call between sessions)"""
        self._hash_cache.clear()
        self._pseudonym_map.clear()
        self._reverse_pseudonym_map.clear()
    
    # ----------------------
    # Internal Methods
    # ----------------------
    
    async def _apply_technique(
        self,
        value: Any,
        rule: AnonymizationRule,
    ) -> Any:
        """Apply specific anonymization technique"""
        
        if rule.technique == AnonymizationTechnique.HASH:
            return self._hash_value(str(value), rule.field_type)
        
        elif rule.technique == AnonymizationTechnique.PSEUDONYMIZE:
            return await self._pseudonymize(str(value), rule.field_type)
        
        elif rule.technique == AnonymizationTechnique.MASK:
            return self._mask_value(str(value), rule)
        
        elif rule.technique == AnonymizationTechnique.GENERALIZE:
            return self._generalize_value(value, rule)
        
        elif rule.technique == AnonymizationTechnique.SUPPRESS:
            return None
        
        elif rule.technique == AnonymizationTechnique.REDACT:
            return f"<{rule.field_type.value.upper()}_REDACTED>"
        
        else:
            logger.warning(f"Unknown technique: {rule.technique}")
            return value
    
    def _hash_value(self, value: str, field_type: PIIFieldType) -> str:
        """
        Secure irreversible hash using HMAC-SHA256.
        Consistent hashing: same input → same output (within session).
        """
        cache_key = f"{field_type.value}:{value}"
        
        if self.config.consistent_hashing and cache_key in self._hash_cache:
            return self._hash_cache[cache_key]
        
        if self.config.use_hmac:
            # HMAC for added security
            hashed = hmac.new(
                self.config.hash_salt.encode(),
                value.encode(),
                hashlib.sha256
            ).hexdigest()
        else:
            # Simple salted hash
            combined = f"{self.config.hash_salt}|{value}"
            hashed = hashlib.sha256(combined.encode()).hexdigest()
        
        # Optional: truncate for display
        hashed_short = hashed[:16]  # First 16 chars
        
        if self.config.consistent_hashing:
            self._hash_cache[cache_key] = hashed_short
        
        return hashed_short
    
    async def _pseudonymize(self, value: str, field_type: PIIFieldType) -> str:
        """
        Reversible pseudonymization using encryption.
        Requires cryptography library and pseudonym_key in config.
        """
        if value in self._pseudonym_map:
            return self._pseudonym_map[value]
        
        if not self._cipher:
            # Fallback to hash if encryption unavailable
            logger.warning("Pseudonymization unavailable; falling back to hash")
            return self._hash_value(value, field_type)
        
        try:
            encrypted = self._cipher.encrypt(value.encode()).decode()
            
            # Store mapping
            self._pseudonym_map[value] = encrypted
            self._reverse_pseudonym_map[encrypted] = value
            
            return encrypted
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return self._hash_value(value, field_type)
    
    def _mask_value(self, value: str, rule: AnonymizationRule) -> str:
        """
        Mask value while optionally preserving format.
        
        Examples:
        - email: john@example.com → j***@e***.com
        - phone: +1234567890 → +12****7890
        - name: John Doe → J*** D**
        """
        if rule.field_type == PIIFieldType.EMAIL:
            return self._mask_email(value, rule.preserve_format)
        
        elif rule.field_type == PIIFieldType.PHONE:
            return self._mask_phone(value, rule.preserve_format)
        
        elif rule.field_type == PIIFieldType.NAME:
            return self._mask_name(value)
        
        elif rule.field_type == PIIFieldType.IP_ADDRESS:
            return self._mask_ip(value)
        
        elif rule.field_type == PIIFieldType.CREDIT_CARD:
            return self._mask_credit_card(value)
        
        else:
            # Generic masking
            if len(value) <= 3:
                return "*" * len(value)
            
            visible = max(1, len(value) // 4)
            masked = "*" * (len(value) - 2 * visible)
            return value[:visible] + masked + value[-visible:]
    
    def _mask_email(self, email: str, preserve_format: bool = True) -> str:
        """Mask email: john@example.com → j***@e***.com"""
        if not preserve_format:
            return "***@***.***"
        
        try:
            local, domain = email.split("@")
            local_masked = local[0] + "***" if len(local) > 1 else "***"
            domain_parts = domain.split(".")
            domain_masked = domain_parts[0][0] + "***" if len(domain_parts[0]) > 1 else "***"
            domain_masked += "." + ".".join(domain_parts[1:])
            return f"{local_masked}@{domain_masked}"
        except Exception:
            return "***@***.***"
    
    def _mask_phone(self, phone: str, preserve_format: bool = True) -> str:
        """Mask phone: +1234567890 → +12****7890"""
        if not preserve_format:
            return "***-***-****"
        
        # Keep first 3 and last 4 digits
        digits_only = re.sub(r"\D", "", phone)
        if len(digits_only) < 7:
            return "***-***-****"
        
        prefix = phone[:3] if phone[0] == "+" else digits_only[:2]
        suffix = digits_only[-4:]
        masked_middle = "*" * (len(digits_only) - 6)
        
        return f"{prefix}{masked_middle}{suffix}"
    
    def _mask_name(self, name: str) -> str:
        """Mask name: John Doe → J*** D**"""
        parts = name.split()
        masked_parts = [p[0] + "*" * (len(p) - 1) if len(p) > 1 else "*" for p in parts]
        return " ".join(masked_parts)
    
    def _mask_ip(self, ip: str) -> str:
        """Mask IP: 192.168.1.100 → 192.168.*.*"""
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.*.*"
        return "***.*.*.*"
    
    def _mask_credit_card(self, cc: str) -> str:
        """Mask credit card: 1234-5678-9012-3456 → ****-****-****-3456"""
        digits_only = re.sub(r"\D", "", cc)
        if len(digits_only) < 4:
            return "****-****-****-****"
        return "****-****-****-" + digits_only[-4:]
    
    def _generalize_value(self, value: Any, rule: AnonymizationRule) -> Any:
        """
        Reduce precision for generalization.
        
        Examples:
        - Age 28 → Age range 25-30
        - Date 1990-05-15 → Year 1990
        - IP 192.168.1.100 → 192.168.0.0/16
        """
        level = rule.generalization_level or 1
        
        # Date generalization
        if isinstance(value, (date, datetime)):
            if level == 1:  # Year only
                return value.year
            elif level == 2:  # Year-Month
                return f"{value.year}-{value.month:02d}"
            else:
                return value.year
        
        # Numeric generalization (age, salary, etc.)
        if isinstance(value, (int, float)):
            if level == 1:  # Round to nearest 10
                return int(value // 10 * 10)
            elif level == 2:  # Round to nearest 100
                return int(value // 100 * 100)
            else:
                return int(value // 10 * 10)
        
        # IP generalization
        if rule.field_type == PIIFieldType.IP_ADDRESS and isinstance(value, str):
            parts = value.split(".")
            if len(parts) == 4:
                if level == 1:
                    return f"{parts[0]}.{parts[1]}.0.0"
                elif level == 2:
                    return f"{parts[0]}.0.0.0"
        
        # String generalization (first N characters)
        if isinstance(value, str):
            max_len = max(5, len(value) // (level + 1))
            return value[:max_len] + "..."
        
        return value


# --------------------------
# GDPR Compliance Helpers
# --------------------------

async def comply_with_gdpr(
    records: List[Dict[str, Any]],
    auto_detect: bool = True,
) -> List[Dict[str, Any]]:
    """
    Auto-detect and anonymize PII in records for GDPR compliance.
    
    This is a convenience function for quick GDPR anonymization.
    For production, use explicit rules with Anonymizer class.
    """
    config = AnonymizationConfig(
        hash_salt=settings.ANONYMIZATION_SALT,
        audit_log_enabled=True,
    )
    anonymizer = Anonymizer(config)
    
    # Detect PII in first record (assume schema is consistent)
    if not records:
        return []
    
    detected_pii = anonymizer.detect_pii_fields(records[0])
    
    # Build rules
    rules: List[AnonymizationRule] = []
    for field_name, pii_type in detected_pii.items():
        # Email/phone: hash; Name: mask; IP: generalize
        if pii_type == PIIFieldType.EMAIL:
            technique = AnonymizationTechnique.HASH
        elif pii_type == PIIFieldType.PHONE:
            technique = AnonymizationTechnique.MASK
        elif pii_type == PIIFieldType.NAME:
            technique = AnonymizationTechnique.MASK
        elif pii_type == PIIFieldType.IP_ADDRESS:
            technique = AnonymizationTechnique.GENERALIZE
        else:
            technique = AnonymizationTechnique.HASH
        
        rules.append(AnonymizationRule(field_name, pii_type, technique))
    
    return await anonymizer.anonymize_batch(records, rules)


def generate_fernet_key() -> bytes:
    """Generate a Fernet key for pseudonymization (store securely!)"""
    if not CRYPTO_AVAILABLE:
        raise ImportError("cryptography library required for key generation")
    return Fernet.generate_key()
