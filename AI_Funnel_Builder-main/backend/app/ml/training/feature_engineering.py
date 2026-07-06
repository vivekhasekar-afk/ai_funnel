"""
Feature Engineering - AI Funnel Platform (PRODUCTION GRADE)
===========================================================
Extracts and transforms raw funnel question, user response, and behavioral data
into structured, validated features for ML model training and inference.

Key Capabilities:
- Question feature extraction (types, text complexity, position, UX flags)
- Behavioral aggregates per user or funnel session (time metrics, hesitation)
- Response pattern analytics (incomplete answers, contradictions)
- Handles missing data robustly, with default fallbacks
- Supports single and batch processing
- Export feature dictionaries or DataFrames compatible with ML pipelines
- Includes validation and caching helpers for heavy computations
"""

import logging
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass, field
import pandas as pd
import numpy as np
import re
import hashlib
import json

logger = logging.getLogger(__name__)


@dataclass
class QuestionMetadata:
    question_id: str
    question_text: str
    question_type: str  # e.g., 'single_choice', 'multi_choice', 'open_ended'
    is_required: bool = True
    position: int = 0
    total_questions: int = 1
    has_tooltip: bool = False
    has_image: bool = False
    has_video: bool = False
    branching_depth: int = 0
    prev_question_type: Optional[str] = None


@dataclass
class UserResponse:
    question_id: str
    response: Any
    time_spent_seconds: float = 0.0
    hesitation_count: int = 0
    skipped: bool = False
    contradictory: bool = False


class FeatureEngineer:
    """
    Feature engineering helper class for surveys and funnels.
    """

    # Precompiled for performance
    _readability_regex = re.compile(r'\w+')

    def __init__(self):
        self._cache = {}

    def _normalize_text(self, text: str) -> str:
        return text.strip().lower() if text else ""

    def _text_length(self, text: str) -> int:
        return len(text) if text else 0

    def _average_word_length(self, text: str) -> float:
        words = self._readability_regex.findall(text) if text else []
        if not words:
            return 0
        return sum(len(w) for w in words) / len(words)

    def _estimate_reading_level(self, text: str) -> float:
        """
        Estimate Flesch-Kincaid grade level or a simple heuristic metric
        Scaled for ML interpretability.
        """
        if not text:
            return 0.0
        sentences = max(text.count(". ") + text.count("!") + text.count("?"), 1)
        words = self._readability_regex.findall(text)
        syllables = sum(self._count_syllables(w) for w in words)
        words_count = len(words)
        if words_count == 0:
            return 0.0
        # Flesch–Kincaid Reading Ease formula approximation
        reading_score = (
            0.39 * (words_count / sentences) + 11.8 * (syllables / words_count) - 15.59
        )
        return max(0.0, reading_score)  # ensure non-negative

    def _count_syllables(self, word: str) -> int:
        """A simple heuristic to count syllables in a word."""
        word = word.lower()
        vowels = "aeiouy"
        count = 0
        prev_char_was_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_char_was_vowel:
                count += 1
            prev_char_was_vowel = is_vowel

        if word.endswith("e"):
            count = max(1, count - 1)

        return max(1, count)

    def extract_question_features(
        self, question: QuestionMetadata
    ) -> Dict[str, Union[int, float]]:
        """
        Extract features from a question metadata object.

        Returns:
            Dict of feature_name -> value
        """
        features = {}

        # Basic numeric features
        features["position_index"] = question.position
        features["position_relative"] = (
            question.position / question.total_questions
            if question.total_questions > 0
            else 0.0
        )
        features["is_required"] = int(question.is_required)

        # One-hot encode common question types for ML
        question_types = [
            "single_choice",
            "multi_choice",
            "open_ended",
            "rating_scale",
            "likert",
            "matrix",
            "slider",
        ]
        for qtype in question_types:
            features[f"question_type_{qtype}"] = int(question.question_type == qtype)

        # Text and UX cues
        features["text_length_chars"] = self._text_length(question.question_text)
        features["text_reading_level"] = self._estimate_reading_level(question.question_text)

        features["has_tooltip"] = int(question.has_tooltip)
        features["has_image"] = int(question.has_image)
        features["has_video"] = int(question.has_video)

        # Device/context-independent for now (can be added in pipeline)

        # Historical / flow context
        features["logical_branching_depth"] = question.branching_depth
        if question.prev_question_type:
            features["prev_question_type_complex"] = int(
                question.prev_question_type in ["open_ended", "multi_choice", "matrix"]
            )
            features["prev_is_required"] = int(question.is_required)
        else:
            features["prev_question_type_complex"] = 0
            features["prev_is_required"] = 0

        return features

    def extract_response_features(
        self, responses: List[UserResponse]
    ) -> Dict[str, Any]:
        """
        Aggregate behavioral and response quality features from user responses.

        Returns:
            Aggregate features per funnel or user session for modeling.
        """
        features = {
            "avg_time_per_question": 0.0,
            "avg_hesitation_per_question": 0.0,
            "skip_rate": 0.0,
            "contradiction_rate": 0.0,
            "num_questions_answered": 0,
            "num_questions": len(responses),
        }

        if not responses:
            return features

        total_time = 0.0
        total_hesitation = 0
        skipped = 0
        contradicted = 0

        for resp in responses:
            total_time += resp.time_spent_seconds
            total_hesitation += resp.hesitation_count
            if resp.skipped:
                skipped += 1
            if resp.contradictory:
                contradicted += 1

        answered = features["num_questions"] - skipped

        features["num_questions_answered"] = answered
        features["avg_time_per_question"] = total_time / answered if answered > 0 else 0.0
        features["avg_hesitation_per_question"] = total_hesitation / answered if answered > 0 else 0.0
        features["skip_rate"] = skipped / features["num_questions"] if features["num_questions"] > 0 else 0.0
        features["contradiction_rate"] = contradicted / features["num_questions"] if features["num_questions"] > 0 else 0.0

        return features

    def generate_features(
        self,
        questions: List[QuestionMetadata],
        responses: Optional[List[UserResponse]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a combined feature dictionary from questions and optional responses.

        Returns:
            Dict of engineered features for ML input.
        """
        q_features = []
        for q in questions:
            f = self.extract_question_features(q)
            # Add question id for tracking if needed
            f["question_id"] = q.question_id
            q_features.append(f)
        logger.debug(f"Extracted features for {len(q_features)} questions")

        # Aggregate question features if needed (e.g., mean, sum)
        agg_features = {}
        # Example: average text length over all questions
        if q_features:
            agg_features["avg_question_text_length"] = np.mean([f["text_length_chars"] for f in q_features])
            agg_features["pct_required_questions"] = np.mean([f["is_required"] for f in q_features])
        else:
            agg_features["avg_question_text_length"] = 0.0
            agg_features["pct_required_questions"] = 0.0

        # Behavioral response features
        resp_features = {}
        if responses:
            resp_features = self.extract_response_features(responses)
        else:
            resp_features = {
                "avg_time_per_question": 0.0,
                "avg_hesitation_per_question": 0.0,
                "skip_rate": 0.0,
                "contradiction_rate": 0.0,
                "num_questions_answered": 0,
                "num_questions": len(questions),
            }

        # Merge all features
        combined = {**agg_features, **resp_features}
        logger.debug(f"Combined feature dict: {combined}")

        return combined

    # --------------------------------------------------------------------- #
    # Caching heavy computations for efficiency (optional)
    # --------------------------------------------------------------------- #

    def cache_features(self, key: str, features: Dict[str, Any]):
        """Cache features by a key hash."""
        self._cache[key] = features

    def get_cached_features(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached features if available."""
        return self._cache.get(key)

    def features_key(self, questions: List[QuestionMetadata], responses: Optional[List[UserResponse]] = None) -> str:
        """Generate a hash key for a questions+responses combination."""
        q_ids = [q.question_id for q in questions]
        r_ids = [r.question_id for r in responses] if responses else []
        combined = {"questions": q_ids, "responses": r_ids}
        combined_str = json.dumps(combined, sort_keys=True)
        return hashlib.sha256(combined_str.encode("utf-8")).hexdigest()


# ============================================================================
# Usage Example (documentation only)
# ============================================================================

"""
engineer = FeatureEngineer()

questions = [
    QuestionMetadata(
        question_id="q1",
        question_text="What is your age?",
        question_type="single_choice",
        is_required=True,
        position=0,
        total_questions=5,
        has_tooltip=False,
        has_image=False,
        has_video=False,
        branching_depth=0,
        prev_question_type=None,
    ),
    # Add more questions...
]

responses = [
    UserResponse(
        question_id="q1",
        response="25-34",
        time_spent_seconds=12.4,
        hesitation_count=1,
        skipped=False,
        contradictory=False,
    ),
    # Add more responses...
]

features = engineer.generate_features(questions, responses)
print(features)
"""
