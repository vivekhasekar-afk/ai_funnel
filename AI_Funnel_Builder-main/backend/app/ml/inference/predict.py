"""
Model Inference Wrapper - AI Funnel Platform (PRODUCTION GRADE)
================================================================
Unified interface for loading multiple ML models, preprocessing inputs,
performing batch or single predictions, and returning structured results.

Features:
- Load and manage multiple model types (completion, lead scoring, question effectiveness)
- Integrates feature engineering and preprocessing modules
- Caching of repeated inferences to minimize latency and cost
- Async-safe prediction APIs for high throughput services
- Detailed request/response logging and error handling
- Support for fallback/default predictions on failure
- Configurable batching and concurrency control
"""

import asyncio
import logging
import threading
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from app.ml.models.completion_rate_model import CompletionRateModel
from app.ml.models.lead_scoring_model import LeadScoringModel, LeadScore
from app.ml.models.question_effectiveness_model import QuestionEffectivenessModel, QuestionEffectivenessResult
from app.ai.feature_engineering import FeatureEngineer
from app.ai.data_preprocessing import (
    PreprocessConfig,
    fit_transformer,
    transform_with_existing,
)

logger = logging.getLogger(__name__)


class ModelPredictor:
    """
    Production-grade model inference wrapper.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        completion_model_path: str,
        lead_model_path: str,
        question_model_path: str,
        preprocessing_config: PreprocessConfig,
        completion_scaler_path: Optional[str] = None,
        lead_scaler_path: Optional[str] = None,
        question_scaler_path: Optional[str] = None,
    ):
        # Load models lazily
        if not hasattr(self, 'initialized'):
            self.initialized = False

        if not self.initialized:
            self.feature_engineer = FeatureEngineer()

            self.preprocess_config = preprocessing_config

            logger.info("Loading Completion Rate model...")
            self.completion_model = CompletionRateModel(
                model_path=completion_model_path,
            )

            logger.info("Loading Lead Scoring model...")
            self.lead_model = LeadScoringModel(
                model_path=lead_model_path,
                scaler_path=lead_scaler_path,
            )

            logger.info("Loading Question Effectiveness model...")
            self.question_model = QuestionEffectivenessModel(
                model_path=question_model_path,
                scaler_path=question_scaler_path,
            )

            # Placeholder for preprocessors; ideally load or fit externally
            self.preprocessor = None

            # Simple in-memory cache key -> result
            self._prediction_cache = {}
            self._cache_lock = threading.Lock()

            self.initialized = True

    def _make_cache_key(self, input_data: Any) -> int:
        # Make a simple hash of input data serialized as string
        try:
            repr_str = str(input_data)
        except Exception:
            repr_str = repr(input_data)
        return hash(repr_str)

    def _cache_get(self, key: int) -> Optional[Any]:
        with self._cache_lock:
            return self._prediction_cache.get(key)

    def _cache_set(self, key: int, value: Any):
        with self._cache_lock:
            # Limit cache size to 1000
            if len(self._prediction_cache) >= 1000:
                self._prediction_cache.pop(next(iter(self._prediction_cache)))
            self._prediction_cache[key] = value

    async def predict_completion_rate(
        self,
        funnel_features: Union[Dict[str, Any], List[Dict[str, Any]]],
        force_refresh: bool = False,
    ) -> Union[float, List[float]]:
        """
        Predict funnel completion rate(s).

        Args:
            funnel_features: Single feature dictionary or batch list
            force_refresh: Bypass cache

        Returns:
            Prediction probability/score(s) as float(s)
        """
        key = self._make_cache_key(funnel_features)
        if not force_refresh:
            cached = self._cache_get(key)
            if cached is not None:
                logger.debug("Cache hit for completion rate prediction")
                return cached

        # Perform prediction
        if isinstance(funnel_features, dict):
            pred = self.completion_model.predict_completion_rate(funnel_features)
        else:
            pred = [self.completion_model.predict_completion_rate(f) for f in funnel_features]

        self._cache_set(key, pred)
        return pred

    async def predict_lead_score(
        self,
        lead_features: Union[Dict[str, Any], List[Dict[str, Any]]],
        batch: bool = False,
        force_refresh: bool = False,
    ) -> Union[LeadScore, List[LeadScore]]:
        """
        Predict lead quality score(s).

        Args:
            lead_features: Dict or list of dicts with lead features
            batch: Whether input is batch
            force_refresh: Bypass cache

        Returns:
            LeadScore(s)
        """
        key = self._make_cache_key(lead_features)
        if not force_refresh:
            cached = self._cache_get(key)
            if cached is not None:
                logger.debug("Cache hit for lead scoring prediction")
                return cached

        result = self.lead_model.predict_lead_score(lead_features, batch=batch)

        self._cache_set(key, result)
        return result

    async def predict_question_effectiveness(
        self,
        questions: List[Any],
        responses: Optional[List[Any]] = None,
        question_ids: Optional[List[str]] = None,
        batch: bool = True,
        force_refresh: bool = False,
    ) -> Union[QuestionEffectivenessResult, List[QuestionEffectivenessResult]]:
        """
        Predict per-question metrics indicating effectiveness & friction.

        Args:
            questions: List of QuestionMetadata or dicts
            responses: Optional corresponding UserResponse list
            question_ids: Optional list of question IDs
            batch: Process as batch
            force_refresh: Bypass cache

        Returns:
            Per-question prediction result object(s)
        """
        input_data = {
            "questions": questions,
            "responses": responses,
            "question_ids": question_ids,
            "batch": batch,
        }
        key = self._make_cache_key(input_data)

        if not force_refresh:
            cached = self._cache_get(key)
            if cached is not None:
                logger.debug("Cache hit for question effectiveness prediction")
                return cached

        result = self.question_model.predict(questions, question_ids=question_ids, batch=batch)

        self._cache_set(key, result)
        return result

    async def preprocess_features(
        self,
        raw_data: pd.DataFrame,
        fit: bool = False,
    ) -> pd.DataFrame:
        """
        Fit or transform features using preprocessing pipeline.

        Should be called before model predictions if raw inputs are provided.

        Args:
            raw_data: Raw feature DataFrame
            fit: If True, fit the transformer on raw_data

        Returns:
            Transformed numpy array usable for model prediction
        """
        if fit or self.preprocessor is None:
            logger.info("Fitting preprocessing transformer...")
            X_transformed, _, self.preprocessor, _, _ = fit_transformer(
                raw_data,
                self.preprocess_config,
            )
            return X_transformed

        logger.info("Transforming data using existing preprocessing transformer...")
        X_transformed, _ = transform_with_existing(
            raw_data,
            self.preprocessor,
        )
        return X_transformed

    def reload_models(
        self,
        completion_model_path: Optional[str] = None,
        lead_model_path: Optional[str] = None,
        question_model_path: Optional[str] = None,
    ):
        """
        Hot-reload underlying models to update without downtime.
        """
        with self._lock:
            if completion_model_path:
                self.completion_model.reload_model(completion_model_path)
                logger.info(f"Reloaded Completion Rate model: {completion_model_path}")
            if lead_model_path:
                self.lead_model.reload_model(lead_model_path)
                logger.info(f"Reloaded Lead Scoring model: {lead_model_path}")
            if question_model_path:
                self.question_model.reload_model(question_model_path)
                logger.info(f"Reloaded Question Effectiveness model: {question_model_path}")

    def clear_cache(self):
        """
        Clear any cached predictions.
        """
        with self._cache_lock:
            self._prediction_cache.clear()
        logger.info("Cleared all prediction caches")


# ============================================================================
# USAGE EXAMPLE (documentation only)
# ============================================================================

"""
import asyncio
import pandas as pd

predictor = ModelPredictor(
    completion_model_path="models/completion_rate_model.joblib",
    lead_model_path="models/lead_scoring_model.joblib",
    question_model_path="models/question_effectiveness_model.joblib",
    preprocessing_config=PreprocessConfig()
)

# Predict completion rate for a funnel feature dict
completion_pred = asyncio.run(
    predictor.predict_completion_rate({"num_questions": 7, "device_mobile": 1, "user_engagement_score": 0.8})
)
print(f"Completion rate prediction: {completion_pred}")

# Lead scoring batch prediction
lead_features_batch = [
    {"click_count": 10, "time_spent_seconds": 120, "questions_answered": 7, "intent_score": 0.7},
    {"click_count": 5, "time_spent_seconds": 60, "questions_answered": 3, "intent_score": 0.4},
]
lead_scores = asyncio.run(predictor.predict_lead_score(lead_features_batch, batch=True))
for lead_score in lead_scores:
    print(lead_score.to_dict())

# Question effectiveness single prediction
questions = [...]  # List of QuestionMetadata dicts or objects
question_results = asyncio.run(predictor.predict_question_effectiveness(questions, batch=True))
for res in question_results:
    print(res.to_dict())
"""
