"""Fallback heuristic risk score, used when a repository doesn't yet have
enough history/variance to train a reliable XGBoost model (see
MIN_TRAINING_SAMPLES in config, and app.ml.train.should_use_heuristic).

Each metric is min-max normalized across the current file set, then
combined with hand-tuned weights reflecting how strongly each factor is
associated with defect-proneness in empirical software-engineering
research (churn and prior bug-fix history are the strongest signals;
raw file size the weakest).
"""

from app.ml.features import FEATURE_NAMES

WEIGHTS = {
    "churn": 0.22,
    "commit_frequency": 0.12,
    "bug_fix_frequency": 0.28,
    "file_age_days": -0.05,  # older, stable files are slightly *less* risky
    "loc": 0.08,
    "cyclomatic_complexity": 0.18,
    "developer_count": 0.10,
    "coupling_score": 0.15,
}

HEURISTIC_MODEL_VERSION = "heuristic-v1"


def _normalize(values: list[float]) -> list[float]:
    lo, hi = min(values), max(values)
    if hi - lo < 1e-9:
        return [0.5 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def score_files(rows: list[dict]) -> list[dict]:
    """rows: list of raw metric dicts. Returns list of
    {defect_probability, feature_contributions} aligned to input order.
    """
    if not rows:
        return []

    normalized_by_feature: dict[str, list[float]] = {}
    for name in FEATURE_NAMES:
        raw = [float(r.get(name, 0) or 0) for r in rows]
        normalized_by_feature[name] = _normalize(raw)

    total_weight = sum(abs(w) for w in WEIGHTS.values())
    results = []
    for i in range(len(rows)):
        contributions: dict[str, float] = {}
        score = 0.0
        for name in FEATURE_NAMES:
            weight = WEIGHTS.get(name, 0.0)
            norm_val = normalized_by_feature[name][i]
            contribution = weight * norm_val
            score += contribution
            contributions[name] = round(contribution / total_weight, 4)
        # shift/scale so the weighted sum (which can be slightly negative
        # due to the file_age penalty) maps cleanly into 0..1
        probability = max(0.0, min(1.0, (score + 0.05) / (total_weight * 0.6)))
        results.append({"defect_probability": round(probability, 4), "feature_contributions": contributions})
    return results
