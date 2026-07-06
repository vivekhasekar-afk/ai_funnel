"""
Train Lead Scoring Model - AI Funnel Platform (PRODUCTION GRADE)
=================================================================
Trains a classification model to predict whether a lead is "qualified"
(positive class) based on engagement, behavioral, demographic, and
psychographic features, then maps probabilities to a 0–100 lead score.

Pipeline:
    1. Load prepared lead-level dataset
    2. Clean & encode features
    3. Split into train/validation sets
    4. Train RandomForest (or GradientBoosting) with class imbalance handling
    5. Evaluate with ROC-AUC, F1, precision, recall
    6. Persist model + optional scaler + metadata for production

This script is intended to be run as a CLI tool or scheduled training job.
"""

import argparse
import json
import logging
import os
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("train_lead_scoring")


# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

@dataclass
class TrainConfig:
    # Data
    input_path: str
    target_column: str = "is_qualified"   # binary: 1 = good lead, 0 = bad
    id_columns: Optional[List[str]] = None

    # Split
    test_size: float = 0.2
    random_state: int = 42

    # Model
    n_estimators: int = 300
    max_depth: Optional[int] = None
    min_samples_split: int = 2
    min_samples_leaf: int = 1
    max_features: str = "sqrt"
    class_weight: str = "balanced"       # handle imbalance

    # Preprocessing
    use_scaler: bool = False

    # Artifacts
    output_dir: str = "models"
    model_name: str = "lead_scoring_model"

    # Misc
    n_jobs: int = -1


@dataclass
class TrainMetadata:
    model_path: str
    scaler_path: Optional[str]
    created_at: str
    config: Dict[str, Any]
    metrics: Dict[str, Any]
    feature_order: List[str]


# -----------------------------------------------------------------------------
# DATA LOADING
# -----------------------------------------------------------------------------

def load_data(config: TrainConfig) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    logger.info(f"📥 Loading lead dataset from {config.input_path}")
    if not os.path.exists(config.input_path):
        raise FileNotFoundError(f"Input data not found: {config.input_path}")

    if config.input_path.endswith(".csv"):
        df = pd.read_csv(config.input_path)
    elif config.input_path.endswith((".parquet", ".pq")):
        df = pd.read_parquet(config.input_path)
    else:
        raise ValueError("Unsupported format. Use .csv or .parquet")

    if config.target_column not in df.columns:
        raise ValueError(f"Target column '{config.target_column}' not found")

    # Drop rows with missing target
    df = df.dropna(subset=[config.target_column])

    y = df[config.target_column].astype(int)
    X = df.drop(columns=[config.target_column])

    # Drop ID-like columns
    if config.id_columns:
        for col in config.id_columns:
            if col in X.columns:
                X = X.drop(columns=[col])

    # Encode non-numeric as category codes
    for col in X.columns:
        if not np.issubdtype(X[col].dtype, np.number):
            X[col] = X[col].astype("category").cat.codes

    X = X.fillna(0)

    feature_order = list(X.columns)
    logger.info(f"✅ Loaded {len(X)} leads with {len(feature_order)} features")

    # Basic positive rate logging
    pos_rate = y.mean()
    logger.info(f"📊 Positive class rate (is_qualified=1): {pos_rate:.3f}")

    return X, y, feature_order


# -----------------------------------------------------------------------------
# TRAINING
# -----------------------------------------------------------------------------

def train_model(
    X: pd.DataFrame,
    y: pd.Series,
    config: TrainConfig,
) -> Tuple[RandomForestClassifier, Optional[StandardScaler], Dict[str, Any]]:
    logger.info("✂️ Splitting leads into train and validation sets")
    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=config.test_size,
        random_state=config.random_state,
        stratify=y,  # keep class balance
    )

    scaler: Optional[StandardScaler] = None
    if config.use_scaler:
        logger.info("📏 Fitting StandardScaler")
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_val = scaler.transform(X_val)

    logger.info("🚀 Training RandomForest lead scoring model")
    clf = RandomForestClassifier(
        n_estimators=config.n_estimators,
        max_depth=config.max_depth,
        min_samples_split=config.min_samples_split,
        min_samples_leaf=config.min_samples_leaf,
        max_features=config.max_features,
        class_weight=config.class_weight,
        n_jobs=config.n_jobs,
        random_state=config.random_state,
    )

    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_val)
    y_proba = clf.predict_proba(X_val)[:, 1]

    # Metrics
    acc = float(accuracy_score(y_val, y_pred))
    f1 = float(f1_score(y_val, y_pred))
    prec = float(precision_score(y_val, y_pred))
    rec = float(recall_score(y_val, y_pred))
    roc_auc = float(roc_auc_score(y_val, y_proba))

    cm = confusion_matrix(y_val, y_pred).tolist()
    report = classification_report(y_val, y_pred, output_dict=True)

    metrics = {
        "accuracy": acc,
        "f1": f1,
        "precision": prec,
        "recall": rec,
        "roc_auc": roc_auc,
        "confusion_matrix": cm,
        "classification_report": report,
    }

    logger.info(
        "📊 Validation metrics | "
        f"ACC={acc:.3f} | F1={f1:.3f} | PREC={prec:.3f} | REC={rec:.3f} | ROC-AUC={roc_auc:.3f}"
    )

    return clf, scaler, metrics


# -----------------------------------------------------------------------------
# SAVE ARTIFACTS
# -----------------------------------------------------------------------------

def save_artifacts(
    model: RandomForestClassifier,
    scaler: Optional[StandardScaler],
    feature_order: List[str],
    metrics: Dict[str, Any],
    config: TrainConfig,
) -> TrainMetadata:
    os.makedirs(config.output_dir, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    model_filename = f"{config.model_name}_{ts}.joblib"
    model_path = os.path.join(config.output_dir, model_filename)
    logger.info(f"💾 Saving lead scoring model to {model_path}")
    joblib.dump(model, model_path)

    scaler_path = None
    if scaler is not None:
        scaler_filename = f"{config.model_name}_scaler_{ts}.joblib"
        scaler_path = os.path.join(config.output_dir, scaler_filename)
        logger.info(f"💾 Saving scaler to {scaler_path}")
        joblib.dump(scaler, scaler_path)

    metadata = TrainMetadata(
        model_path=model_path,
        scaler_path=scaler_path,
        created_at=datetime.utcnow().isoformat(),
        config=asdict(config),
        metrics=metrics,
        feature_order=feature_order,
    )

    meta_path = os.path.join(config.output_dir, f"{config.model_name}_{ts}_meta.json")
    logger.info(f"💾 Saving metadata to {meta_path}")
    with open(meta_path, "w") as f:
        json.dump(asdict(metadata), f, indent=2)

    feat_path = os.path.join(config.output_dir, f"{config.model_name}_{ts}_features.json")
    with open(feat_path, "w") as f:
        json.dump(feature_order, f, indent=2)
    logger.info(f"💾 Saved feature order to {feat_path}")

    return metadata


# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------

def parse_args() -> TrainConfig:
    parser = argparse.ArgumentParser(description="Train lead scoring classification model")

    parser.add_argument("--input", required=True, help="Path to training data (.csv or .parquet)")
    parser.add_argument("--output_dir", default="models", help="Output directory for artifacts")
    parser.add_argument("--target", default="is_qualified", help="Target column (0/1)")
    parser.add_argument("--id_cols", nargs="*", default=None, help="ID columns to exclude")

    parser.add_argument("--test_size", type=float, default=0.2)
    parser.add_argument("--random_state", type=int, default=42)

    parser.add_argument("--n_estimators", type=int, default=300)
    parser.add_argument("--max_depth", type=int, default=None)
    parser.add_argument("--min_samples_split", type=int, default=2)
    parser.add_argument("--min_samples_leaf", type=int, default=1)
    parser.add_argument("--max_features", type=str, default="sqrt")
    parser.add_argument("--class_weight", type=str, default="balanced")
    parser.add_argument("--use_scaler", action="store_true")

    parser.add_argument("--n_jobs", type=int, default=-1)

    args = parser.parse_args()

    return TrainConfig(
        input_path=args.input,
        output_dir=args.output_dir,
        target_column=args.target,
        id_columns=args.id_cols,
        test_size=args.test_size,
        random_state=args.random_state,
        n_estimators=args.n_estimators,
        max_depth=args.max_depth,
        min_samples_split=args.min_samples_split,
        min_samples_leaf=args.min_samples_leaf,
        max_features=args.max_features,
        class_weight=args.class_weight,
        use_scaler=args.use_scaler,
        n_jobs=args.n_jobs,
    )


def main():
    config = parse_args()
    logger.info(f"🧩 Lead scoring train config: {config}")

    X, y, feature_order = load_data(config)
    model, scaler, metrics = train_model(X, y, config)
    metadata = save_artifacts(model, scaler, feature_order, metrics, config)

    logger.info("✅ Lead scoring training completed")
    logger.info(f"Model saved at: {metadata.model_path}")
    if metadata.scaler_path:
        logger.info(f"Scaler saved at: {metadata.scaler_path}")
    logger.info(f"Metrics summary: "
                f"ACC={metadata.metrics['accuracy']:.3f}, "
                f"F1={metadata.metrics['f1']:.3f}, "
                f"ROC-AUC={metadata.metrics['roc_auc']:.3f}")


if __name__ == "__main__":
    main()
