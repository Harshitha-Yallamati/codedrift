from xgboost import XGBClassifier

from app.ml.features import FEATURE_NAMES, to_matrix

RISK_THRESHOLDS = [
    (0.75, "critical"),
    (0.5, "high"),
    (0.25, "medium"),
    (0.0, "low"),
]


def categorize(probability: float) -> str:
    for threshold, category in RISK_THRESHOLDS:
        if probability >= threshold:
            return category
    return "low"


def predict_with_model(model: XGBClassifier, rows: list[dict]) -> list[dict]:
    import numpy as np

    X = np.array(to_matrix(rows))
    probabilities = model.predict_proba(X)[:, 1]

    importances = getattr(model, "feature_importances_", [0.0] * len(FEATURE_NAMES))
    booster_importance = dict(zip(FEATURE_NAMES, importances))
    total_importance = sum(booster_importance.values()) or 1.0

    results = []
    for row, proba in zip(rows, probabilities):
        # Approximate per-file contribution: feature importance weighted by
        # how far the file's (normalized-ish) value sits from a "typical" low value.
        contributions = {}
        for name in FEATURE_NAMES:
            weight = booster_importance.get(name, 0.0) / total_importance
            contributions[name] = round(weight, 4)
        results.append({"defect_probability": round(float(proba), 4), "feature_contributions": contributions})
    return results
