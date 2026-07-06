"""
Data Preprocessing - AI Funnel Platform (PRODUCTION GRADE)
==========================================================
Shared preprocessing utilities for ML training pipelines:

- Handle missing values
- Encode categorical variables
- Scale numeric features
- Train/validation split with stratification support
- Persist fitted transformers to avoid train/serving skew

Used by:
    - train_completion.py
    - train_lead_scoring.py
    - other ML training scripts
"""

import logging
import os
from dataclasses import dataclass, asdict
from typing import List, Optional, Tuple, Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

@dataclass
class PreprocessConfig:
    numeric_impute_strategy: str = "median"
    categorical_impute_strategy: str = "most_frequent"
    scale_numeric: bool = True
    one_hot_encode: bool = True
    handle_unknown: str = "ignore"  # for OneHotEncoder
    test_size: float = 0.2
    random_state: int = 42
    stratify: bool = False  # whether to stratify by y
    output_dir: str = "models/preprocessing"
    transformer_name: str = "preprocess_transformer"


@dataclass
class PreprocessArtifacts:
    transformer_path: str
    created_at: str
    config: Dict[str, Any]
    numeric_features: List[str]
    categorical_features: List[str]


# -----------------------------------------------------------------------------
# CORE FUNCTIONS
# -----------------------------------------------------------------------------

def infer_feature_types(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    """
    Infer numeric vs categorical columns based on dtype and cardinality.

    Returns:
        numeric_cols, categorical_cols
    """
    numeric_cols = []
    categorical_cols = []

    for col in df.columns:
        if np.issubdtype(df[col].dtype, np.number):
            numeric_cols.append(col)
        else:
            # For object / category, treat as categorical
            categorical_cols.append(col)

    logger.info(
        f"Inferred {len(numeric_cols)} numeric and {len(categorical_cols)} categorical features"
    )
    return numeric_cols, categorical_cols


def build_preprocess_pipeline(
    numeric_features: List[str],
    categorical_features: List[str],
    config: PreprocessConfig,
) -> ColumnTransformer:
    """
    Build a ColumnTransformer that will:
      - Impute + scale numeric features
      - Impute + one-hot encode categorical features
    """
    numeric_transformers = []
    if config.numeric_impute_strategy:
        numeric_transformers.append(
            ("imputer", SimpleImputer(strategy=config.numeric_impute_strategy))
        )
    if config.scale_numeric:
        numeric_transformers.append(("scaler", StandardScaler()))

    numeric_pipeline = Pipeline(steps=numeric_transformers)

    cat_transformers = []
    if config.categorical_impute_strategy:
        cat_transformers.append(
            ("imputer", SimpleImputer(strategy=config.categorical_impute_strategy))
        )
    if config.one_hot_encode:
        cat_transformers.append(
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown=config.handle_unknown,
                    sparse_output=False,
                ),
            )
        )

    categorical_pipeline = Pipeline(steps=cat_transformers)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric_features),
            ("cat", categorical_pipeline, categorical_features),
        ],
        remainder="drop",
    )

    return preprocessor


def fit_transformer(
    df: pd.DataFrame,
    config: PreprocessConfig,
    target_col: Optional[str] = None,
    drop_cols: Optional[List[str]] = None,
) -> Tuple[np.ndarray, Optional[pd.Series], ColumnTransformer, List[str], List[str]]:
    """
    Fit a preprocessing transformer on the dataset and transform X.

    Args:
        df: Raw dataframe
        config: PreprocessConfig
        target_col: Optional target column name (will be separated)
        drop_cols: Optional columns to drop (ids, timestamps)

    Returns:
        X_transformed, y (optional), transformer, numeric_features, categorical_features
    """
    df = df.copy()

    y = None
    if target_col and target_col in df.columns:
        y = df[target_col]
        df = df.drop(columns=[target_col])

    if drop_cols:
        for col in drop_cols:
            if col in df.columns:
                df = df.drop(columns=[col])

    numeric_features, categorical_features = infer_feature_types(df)

    preprocessor = build_preprocess_pipeline(numeric_features, categorical_features, config)

    logger.info("Fitting preprocessing transformer")
    X_transformed = preprocessor.fit_transform(df)

    return X_transformed, y, preprocessor, numeric_features, categorical_features


def transform_with_existing(
    df: pd.DataFrame,
    transformer: ColumnTransformer,
    target_col: Optional[str] = None,
    drop_cols: Optional[List[str]] = None,
) -> Tuple[np.ndarray, Optional[pd.Series]]:
    """
    Transform data using an already-fitted transformer (for evaluation or inference).
    """
    df = df.copy()

    y = None
    if target_col and target_col in df.columns:
        y = df[target_col]
        df = df.drop(columns=[target_col])

    if drop_cols:
        for col in drop_cols:
            if col in df.columns:
                df = df.drop(columns=[col])

    logger.info("Transforming data with existing preprocessing transformer")
    X_transformed = transformer.transform(df)
    return X_transformed, y


def save_transformer(
    transformer: ColumnTransformer,
    numeric_features: List[str],
    categorical_features: List[str],
    config: PreprocessConfig,
) -> PreprocessArtifacts:
    """
    Persist fitted transformer + feature lists to disk.
    """
    os.makedirs(config.output_dir, exist_ok=True)
    from datetime import datetime as dt

    ts = dt.utcnow().strftime("%Y%m%dT%H%M%SZ")
    transformer_filename = f"{config.transformer_name}_{ts}.joblib"
    transformer_path = os.path.join(config.output_dir, transformer_filename)

    logger.info(f"💾 Saving preprocessing transformer to {transformer_path}")
    joblib.dump(transformer, transformer_path)

    artifacts = PreprocessArtifacts(
        transformer_path=transformer_path,
        created_at=dt.utcnow().isoformat(),
        config=asdict(config),
        numeric_features=numeric_features,
        categorical_features=categorical_features,
    )

    meta_path = os.path.join(config.output_dir, f"{config.transformer_name}_{ts}_meta.json")
    logger.info(f"💾 Saving preprocessing metadata to {meta_path}")
    with open(meta_path, "w") as f:
        import json
        json.dump(asdict(artifacts), f, indent=2)

    return artifacts


def train_val_split(
    X: np.ndarray,
    y: Optional[pd.Series],
    config: PreprocessConfig,
) -> Tuple[np.ndarray, np.ndarray, Optional[pd.Series], Optional[pd.Series]]:
    """
    Simple wrapper around train_test_split with optional stratification.
    """
    if y is None:
        logger.warning("train_val_split called without target y; returning full data as train only")
        return X, np.empty((0, X.shape[1])), None, None

    stratify_arg = y if config.stratify else None

    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=config.test_size,
        random_state=config.random_state,
        stratify=stratify_arg,
    )

    return X_train, X_val, y_train, y_val
