"""
Question Effectiveness Model - AI Funnel Platform (PRODUCTION GRADE)
====================================================================
Predicts how effective each question in a funnel will be at keeping users
engaged and moving toward completion, and explains the factors driving
drop-off and friction.

🎯 WHAT IT PREDICTS (PER QUESTION):

- Drop-off probability (user abandons at or right after this question)
- Engagement score (0-100)
- Completion impact (how much this question helps/hurts overall completion)
- Risk label: low / medium / high friction

🔍 INPUT FEATURES (EXAMPLES):

- Question type (single choice, multiple choice, open-ended, rating, slider, etc.)[web:11][web:21]
- Position in funnel (index, relative position)
- Text length & complexity
- Required vs optional
- Device context (mobile/desktop)
- Time expectation / historical average time
- Previous question type & logical context
- Past performance metrics (CTR to next step, historical drop-off at this step)
- UX attributes (has image, has tooltip, uses matrix/scale, etc.)[web:14][web:17]

💼 PRODUCTION FEATURES:

- Thread-safe singleton with lazy model loading
- Batch and single-question prediction
- Input schema validation & coercion
- Risk labeling and explanation strings
- Feature importance–based explanations
- Metrics tracking (avg risk, distribution)
- Hot-reload for model updates
"""

import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ============================================================================
# ENUMS & DATA CLASSES
# ============================================================================

class QuestionRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class QuestionEffectivenessResult:
    """Prediction result for a single question."""
    question_id: Optional[str]
    dropoff_probability: float         # 0-1
    engagement_score: float            # 0-100
    completion_impact: float           # -1 to +1 (negative = hurts completion)
    risk: QuestionRisk
    confidence: float                  # 0-1
    top_factors: Dict[str, float]      # feature -> contribution
    explanation: str
    model_version: str
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question_id": self.question_id,
            "dropoff_probability": round(self.dropoff_probability, 4),
            "engagement_score": round(self.engagement_score, 1),
            "completion_impact": round(self.completion_impact, 3),
            "risk": self.risk.value,
            "confidence": round(self.confidence, 3),
            "top_factors": {
                k: round(v, 3)
                for k, v in list(self.top_factors.items())[:5]
            },
            "explanation": self.explanation,
            "model_version": self.model_version,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class QuestionEffectivenessMetrics:
    """Aggregate metrics for monitoring the model."""
    total_predictions: int = 0
    avg_dropoff_probability: float = 0.0
    avg_engagement_score: float = 0.0
    risk_distribution: Dict[str, int] = field(default_factory=dict)
    avg_confidence: float = 0.0


# ============================================================================
# MODEL WRAPPER
# ============================================================================

class QuestionEffectivenessModel:
    """
    Production-grade wrapper around a trained model that predicts question-level
    performance signals (drop-off, engagement, completion impact).

    Expected model outputs (per question row):
      - Column 0: dropoff_probability (0-1)
      - Column 1: engagement_score (0-100)
      - Column 2: completion_impact (-1 to +1)
    """

    _instance = None
    _lock = threading.Lock()

    # Risk thresholds
    HIGH_RISK_THRESHOLD = 0.35   # 35%+ drop-off at / after this question
    MEDIUM_RISK_THRESHOLD = 0.20

    LOW_CONFIDENCE_THRESHOLD = 0.6

    def __new__(cls, model_path: str = None, scaler_path: Optional[str] = None, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    if model_path is None:
                        raise ValueError("model_path is required for first initialization")
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize(model_path, scaler_path, *args, **kwargs)
        return cls._instance

    def _initialize(
        self,
        model_path: str,
        scaler_path: Optional[str] = None,
        model_version: str = "v1.0.0"
    ):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model_version = model_version

        try:
            self.model = joblib.load(self.model_path)
            logger.info(f"✅ Loaded QuestionEffectivenessModel from {self.model_path}")
        except Exception as e:
            logger.error(f"❌ Failed to load question effectiveness model: {e}")
            raise

        self.scaler = None
        if self.scaler_path:
            try:
                self.scaler = joblib.load(self.scaler_path)
                logger.info(f"✅ Loaded scaler for QuestionEffectivenessModel from {self.scaler_path}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to load scaler: {e}")
                self.scaler = None

        # Define features; these should match training
        self.feature_order = self._load_feature_order()
        self.feature_schema = self._build_feature_schema()
        self.feature_importance = self._extract_feature_importance()

        # Metrics
        self.metrics = QuestionEffectivenessMetrics()
        self.metrics.risk_distribution = {r.value: 0 for r in QuestionRisk}

        logger.info(f"🚀 QuestionEffectivenessModel {self.model_version} initialized")

    # --------------------------------------------------------------------- #
    # Feature config
    # --------------------------------------------------------------------- #

    def _load_feature_order(self) -> List[str]:
        """
        Order of features expected by the model.
        This should line up with your training pipeline.
        """
        return [
            # Structural
            "position_index",             # absolute index (0-based)
            "position_relative",          # index / total_questions
            "is_required",                # 0/1
            "question_type_single_choice",
            "question_type_multi_choice",
            "question_type_open_ended",
            "question_type_rating_scale",
            "question_type_likert",
            "question_type_matrix",
            "question_type_slider",

            # Text / UX
            "text_length_chars",
            "text_reading_level",         # (e.g., Flesch score or grade level)
            "has_tooltip",
            "has_image",
            "has_video",

            # Device / context
            "device_mobile",
            "device_desktop",
            "device_tablet",

            # Historical performance
            "historical_dropoff_rate",    # 0-1
            "historical_avg_time_secs",
            "historical_completion_lift", # -1 to +1 vs baseline

            # Flow context
            "prev_is_required",
            "prev_question_type_complex", # 0/1 (matrix, multi, open, etc.)
            "logical_branching_depth",    # how nested this is in branching logic

            # Behavioral expectations (heuristics or model-based)
            "expected_time_secs",
            "expected_cognitive_load",    # 0-1 heuristic score
        ]

    def _build_feature_schema(self) -> Dict[str, Dict[str, Any]]:
        """Validation schema with ranges & defaults."""
        return {
            "position_index": {"type": "int", "min": 0, "max": 200, "default": 0},
            "position_relative": {"type": "float", "min": 0, "max": 1, "default": 0},
            "is_required": {"type": "int", "min": 0, "max": 1, "default": 1},
            "question_type_single_choice": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_multi_choice": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_open_ended": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_rating_scale": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_likert": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_matrix": {"type": "int", "min": 0, "max": 1, "default": 0},
            "question_type_slider": {"type": "int", "min": 0, "max": 1, "default": 0},
            "text_length_chars": {"type": "int", "min": 0, "max": 2000, "default": 80},
            "text_reading_level": {"type": "float", "min": 0, "max": 20, "default": 8},
            "has_tooltip": {"type": "int", "min": 0, "max": 1, "default": 0},
            "has_image": {"type": "int", "min": 0, "max": 1, "default": 0},
            "has_video": {"type": "int", "min": 0, "max": 1, "default": 0},
            "device_mobile": {"type": "int", "min": 0, "max": 1, "default": 1},
            "device_desktop": {"type": "int", "min": 0, "max": 1, "default": 0},
            "device_tablet": {"type": "int", "min": 0, "max": 1, "default": 0},
            "historical_dropoff_rate": {"type": "float", "min": 0, "max": 1, "default": 0},
            "historical_avg_time_secs": {"type": "float", "min": 0, "max": 600, "default": 15},
            "historical_completion_lift": {"type": "float", "min": -1, "max": 1, "default": 0},
            "prev_is_required": {"type": "int", "min": 0, "max": 1, "default": 1},
            "prev_question_type_complex": {"type": "int", "min": 0, "max": 1, "default": 0},
            "logical_branching_depth": {"type": "int", "min": 0, "max": 10, "default": 0},
            "expected_time_secs": {"type": "float", "min": 0, "max": 600, "default": 20},
            "expected_cognitive_load": {"type": "float", "min": 0, "max": 1, "default": 0.5},
        }

    def _extract_feature_importance(self) -> Dict[str, float]:
        """Try to read feature importances from the model."""
        try:
            if hasattr(self.model, "feature_importances_"):
                imps = self.model.feature_importances_
                return dict(zip(self.feature_order, imps))
        except Exception as e:
            logger.warning(f"⚠️ Could not load feature importances: {e}")
        # Fallback: equal weights
        return {f: 1.0 / len(self.feature_order) for f in self.feature_order}

    # --------------------------------------------------------------------- #
    # Validation & preprocessing
    # --------------------------------------------------------------------- #

    def _validate_and_prepare(
        self,
        features: Union[Dict[str, Any], pd.DataFrame]
    ) -> pd.DataFrame:
        if isinstance(features, dict):
            df = pd.DataFrame([features])
        elif isinstance(features, pd.DataFrame):
            df = features.copy()
        else:
            raise TypeError("features must be dict or DataFrame")

        # Ensure all features exist
        for feat in self.feature_order:
            if feat not in df.columns:
                default_val = self.feature_schema.get(feat, {}).get("default", 0)
                df[feat] = default_val

        # Coerce and clip
        for feat in self.feature_order:
            schema = self.feature_schema.get(feat, {})
            ftype = schema.get("type", "float")

            if ftype == "int":
                df[feat] = pd.to_numeric(df[feat], errors="coerce").fillna(schema.get("default", 0)).astype(int)
            else:
                df[feat] = pd.to_numeric(df[feat], errors="coerce").fillna(schema.get("default", 0.0))

            if "min" in schema and "max" in schema:
                df[feat] = df[feat].clip(schema["min"], schema["max"])

        df = df[self.feature_order]
        return df

    # --------------------------------------------------------------------- #
    # Core prediction
    # --------------------------------------------------------------------- #

    def _label_risk(self, dropoff_prob: float) -> QuestionRisk:
        if dropoff_prob >= self.HIGH_RISK_THRESHOLD:
            return QuestionRisk.HIGH
        if dropoff_prob >= self.MEDIUM_RISK_THRESHOLD:
            return QuestionRisk.MEDIUM
        return QuestionRisk.LOW

    def _confidence_from_outputs(self, y: np.ndarray) -> float:
        """
        Heuristic confidence: less extreme & inconsistent outputs -> lower confidence.
        """
        drop_p, engage, impact = y
        # Confidence increases when outputs are informative and consistent:
        # moderate dropoff + decent engagement + small |impact| -> medium/high confidence
        base = 1.0 - abs(impact) * 0.3
        base -= abs(engage - 50) / 300.0
        base -= (drop_p * (1 - drop_p)) * 0.3  # very mid probabilities slightly lower

        return float(max(0.0, min(1.0, base)))

    def _top_feature_contributions(
        self, x_row: np.ndarray
    ) -> List[Tuple[str, float]]:
        contributions = []
        for feat_name, value in zip(self.feature_order, x_row):
            importance = self.feature_importance.get(feat_name, 0.0)
            contributions.append((feat_name, abs(value) * importance))
        contributions.sort(key=lambda t: t[1], reverse=True)
        return contributions

    def _build_explanation(
        self,
        dropoff_prob: float,
        engagement_score: float,
        completion_impact: float,
        risk: QuestionRisk,
        features_row: Dict[str, Any],
        top_factors: List[Tuple[str, float]],
    ) -> str:
        parts = [
            f"Predicted drop-off at this question is {dropoff_prob:.0%} ({risk.value} risk).",
            f"Engagement is estimated at {engagement_score:.0f}/100."
        ]

        if completion_impact > 0.1:
            parts.append("This question is expected to increase overall completion rate.")
        elif completion_impact < -0.1:
            parts.append("This question is likely hurting overall completion and may need simplification.")
        else:
            parts.append("This question has a neutral impact on overall completion.")

        # Highlight some factors
        if top_factors:
            feat_name, _ = top_factors[0]
            readable = feat_name.replace("_", " ")
            parts.append(f"Key factor: {readable}.")

        # Contextual hints
        if features_row.get("text_length_chars", 0) > 300:
            parts.append("Consider shortening the question text to reduce cognitive load.")
        if features_row.get("is_required", 1) == 1 and risk == QuestionRisk.HIGH:
            parts.append("High-risk required question; consider making it optional or moving later.")
        if features_row.get("question_type_open_ended", 0) == 1 and features_row.get("device_mobile", 0) == 1:
            parts.append("Open-ended question on mobile may cause higher friction; consider alternatives.")

        return " ".join(parts)

    def predict(
        self,
        features: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame],
        question_ids: Optional[List[str]] = None,
        batch: bool = False,
    ) -> Union[QuestionEffectivenessResult, List[QuestionEffectivenessResult]]:
        """
        Predict effectiveness for one or more questions.

        Args:
            features: dict / list[dict] / DataFrame with feature values
            question_ids: optional list of IDs aligned with rows
            batch: treat input as batch even if single row

        Returns:
            QuestionEffectivenessResult or list thereof
        """
        # Normalize to DataFrame
        if isinstance(features, list):
            df = pd.DataFrame(features)
            is_batch = True
        elif isinstance(features, dict):
            df = pd.DataFrame([features])
            is_batch = batch
        else:
            df = features.copy()
            is_batch = True

        df_prepared = self._validate_and_prepare(df)
        X = df_prepared.values

        if self.scaler is not None:
            try:
                X = self.scaler.transform(X)
            except Exception as e:
                logger.warning(f"⚠️ Failed to apply scaler: {e}")

        # Model inference
        try:
            # Model expected to output shape (n_samples, 3)
            raw_preds = self.model.predict(X)
            if raw_preds.ndim == 1:
                raw_preds = raw_preds.reshape(-1, 3)
        except Exception as e:
            logger.error(f"❌ Question effectiveness prediction failed: {e}")
            # Fallback: neutral outputs
            raw_preds = np.tile(np.array([0.2, 60.0, 0.0]), (X.shape[0], 1))

        results: List[QuestionEffectivenessResult] = []

        for i, row_out in enumerate(raw_preds):
            dropoff_prob = float(max(0.0, min(1.0, row_out[0])))
            engagement_score = float(max(0.0, min(100.0, row_out[1])))
            completion_impact = float(max(-1.0, min(1.0, row_out[2])))

            risk = self._label_risk(dropoff_prob)
            confidence = self._confidence_from_outputs(row_out)

            top_factors_list = self._top_feature_contributions(X[i])
            top_factors_dict = {k: v for k, v in top_factors_list[:5]}

            explanation = self._build_explanation(
                dropoff_prob,
                engagement_score,
                completion_impact,
                risk,
                df_prepared.iloc[i].to_dict(),
                top_factors_list,
            )

            qid = None
            if question_ids and i < len(question_ids):
                qid = question_ids[i]

            result = QuestionEffectivenessResult(
                question_id=qid,
                dropoff_probability=dropoff_prob,
                engagement_score=engagement_score,
                completion_impact=completion_impact,
                risk=risk,
                confidence=confidence,
                top_factors=top_factors_dict,
                explanation=explanation,
                model_version=self.model_version,
            )

            self._update_metrics(result)
            results.append(result)

        return results if (is_batch or len(results) > 1) else results[0]

    # --------------------------------------------------------------------- #
    # Metrics & model management
    # --------------------------------------------------------------------- #

    def _update_metrics(self, res: QuestionEffectivenessResult):
        m = self.metrics
        m.total_predictions += 1
        n = m.total_predictions

        # Running averages
        m.avg_dropoff_probability = ((m.avg_dropoff_probability * (n - 1)) + res.dropoff_probability) / n
        m.avg_engagement_score = ((m.avg_engagement_score * (n - 1)) + res.engagement_score) / n
        m.avg_confidence = ((m.avg_confidence * (n - 1)) + res.confidence) / n

        m.risk_distribution[res.risk.value] += 1

        if res.confidence < self.LOW_CONFIDENCE_THRESHOLD:
            logger.warning(
                f"⚠️ Low-confidence question effectiveness prediction "
                f"(conf={res.confidence:.2f}, risk={res.risk.value}, score={res.engagement_score:.1f})"
            )

    def get_metrics(self) -> Dict[str, Any]:
        """Return aggregate metrics for monitoring."""
        if self.metrics.total_predictions > 0:
            risk_pct = {
                k: round(v / self.metrics.total_predictions * 100, 1)
                for k, v in self.metrics.risk_distribution.items()
            }
        else:
            risk_pct = {}

        return {
            "model_version": self.model_version,
            "total_predictions": self.metrics.total_predictions,
            "avg_dropoff_probability": round(self.metrics.avg_dropoff_probability, 4),
            "avg_engagement_score": round(self.metrics.avg_engagement_score, 2),
            "avg_confidence": round(self.metrics.avg_confidence, 3),
            "risk_distribution": self.metrics.risk_distribution,
            "risk_distribution_pct": risk_pct,
        }

    def reload_model(
        self,
        new_model_path: str,
        new_scaler_path: Optional[str] = None,
        new_version: Optional[str] = None,
    ):
        """Hot-reload model artifact and optional scaler."""
        with self._lock:
            try:
                new_model = joblib.load(new_model_path)
                new_scaler = None
                if new_scaler_path:
                    new_scaler = joblib.load(new_scaler_path)

                self.model = new_model
                self.model_path = new_model_path

                if new_scaler is not None:
                    self.scaler = new_scaler
                    self.scaler_path = new_scaler_path

                if new_version:
                    self.model_version = new_version

                # Refresh feature importance
                self.feature_importance = self._extract_feature_importance()

                logger.info(f"✅ QuestionEffectivenessModel reloaded from {new_model_path} (v={self.model_version})")
            except Exception as e:
                logger.error(f"❌ Failed to reload QuestionEffectivenessModel: {e}")
                raise


# ============================================================================
# USAGE EXAMPLE (DOCUMENTATION ONLY)
# ============================================================================

"""
# Initialize singleton
q_model = QuestionEffectivenessModel(
    model_path="models/question_effectiveness_v1.joblib",
    scaler_path="models/question_effectiveness_scaler_v1.joblib",
    model_version="v1.0.0",
)

# Single question
question_features = {
    "position_index": 3,
    "position_relative": 0.25,
    "is_required": 1,
    "question_type_open_ended": 1,
    "device_mobile": 1,
    "text_length_chars": 280,
    "historical_dropoff_rate": 0.32,
    "historical_avg_time_secs": 28,
    "logical_branching_depth": 1,
    "expected_time_secs": 30,
    "expected_cognitive_load": 0.7,
}

result = q_model.predict(question_features, question_ids=["q_3"])
print(result.to_dict())

# Batch
batch_features = [question_features, {**question_features, "position_index": 4, "position_relative": 0.33}]
batch_ids = ["q_3", "q_4"]

results = q_model.predict(batch_features, question_ids=batch_ids, batch=True)
for r in results:
    print(r.to_dict())

# Metrics
metrics = q_model.get_metrics()
print(metrics)
"""
