"""XGBoost training for the per-repository defect-risk classifier."""

from dataclasses import dataclass

import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.core.config import settings
from app.ml.features import FEATURE_NAMES, to_matrix

XGBOOST_MODEL_VERSION = "xgboost-v1"


@dataclass
class TrainResult:
    model: XGBClassifier | None
    metrics: dict
    feature_importance: dict[str, float]
    used_heuristic: bool
    training_samples: int


def should_use_heuristic(labels: list[int]) -> bool:
    if len(labels) < settings.MIN_TRAINING_SAMPLES:
        return True
    if len(set(labels)) < 2:
        return True
    positive = sum(labels)
    if positive < 5 or (len(labels) - positive) < 5:
        return True
    return False


def train_model(rows: list[dict], labels: list[int]) -> TrainResult:
    if should_use_heuristic(labels):
        return TrainResult(
            model=None, metrics={}, feature_importance={}, used_heuristic=True, training_samples=len(labels)
        )

    X = np.array(to_matrix(rows))
    y = np.array(labels)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42,
        scale_pos_weight=max((len(y_train) - sum(y_train)) / max(sum(y_train), 1), 1.0),
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4) if len(set(y_test)) > 1 else None,
    }

    importances = model.feature_importances_
    feature_importance = {
        name: round(float(imp), 4) for name, imp in zip(FEATURE_NAMES, importances)
    }

    return TrainResult(
        model=model,
        metrics=metrics,
        feature_importance=feature_importance,
        used_heuristic=False,
        training_samples=len(labels),
    )
