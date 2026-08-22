"""Plain-English explanation generation from per-file feature contributions.

Ranks the top contributing factors (from either the XGBoost feature
importances or the heuristic weights) and turns them into a short,
human-readable sentence referencing the file's actual metric values so the
explanation is concrete rather than generic.
"""

from app.ml.features import FEATURE_LABELS

_METRIC_PHRASES = {
    "churn": lambda v: f"{int(v)} lines changed across its history",
    "commit_frequency": lambda v: f"{int(v)} commits touching it",
    "bug_fix_frequency": lambda v: f"{int(v)} prior bug-fix commits",
    "file_age_days": lambda v: f"an age of {int(v)} days",
    "loc": lambda v: f"{int(v)} lines of code",
    "cyclomatic_complexity": lambda v: f"an average cyclomatic complexity of {v:.1f}",
    "developer_count": lambda v: f"{int(v)} different contributors",
    "coupling_score": lambda v: f"a coupling score of {v:.2f} (changes together with other files)",
}


def generate_explanation(
    risk_category: str,
    defect_probability: float,
    feature_contributions: dict[str, float],
    raw_metrics: dict,
    model_type: str,
) -> str:
    top_features = sorted(feature_contributions.items(), key=lambda kv: kv[1], reverse=True)[:3]
    top_features = [(name, weight) for name, weight in top_features if weight > 0]

    if not top_features:
        return (
            f"This file has a {risk_category} risk score ({defect_probability:.0%}) with no single "
            "dominant factor — its metrics are close to the repository average."
        )

    phrases = []
    for name, _weight in top_features:
        label = FEATURE_LABELS.get(name, name)
        value = raw_metrics.get(name, 0)
        phrase_fn = _METRIC_PHRASES.get(name)
        detail = phrase_fn(value) if phrase_fn else f"{label} of {value}"
        phrases.append(detail)

    joined = "; ".join(phrases)
    basis = "an XGBoost model trained on this repository's history" if model_type == "xgboost" else "a heuristic risk score"
    return (
        f"This file is flagged {risk_category} risk ({defect_probability:.0%} predicted defect probability) by {basis}, "
        f"primarily driven by {joined}."
    )
