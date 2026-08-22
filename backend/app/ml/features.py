"""Feature engineering: converts a file's raw Git/code metrics into the
ordered numeric vector the ML model (or heuristic fallback) consumes.

Keeping the feature list and ordering in one place means the trained model,
the heuristic fallback, and the explanation generator all agree on what
"churn" etc. means positionally.
"""

FEATURE_NAMES = [
    "churn",
    "commit_frequency",
    "bug_fix_frequency",
    "file_age_days",
    "loc",
    "cyclomatic_complexity",
    "developer_count",
    "coupling_score",
]

FEATURE_LABELS = {
    "churn": "code churn",
    "commit_frequency": "commit frequency",
    "bug_fix_frequency": "bug-fix commit frequency",
    "file_age_days": "file age",
    "loc": "lines of code",
    "cyclomatic_complexity": "cyclomatic complexity",
    "developer_count": "number of contributors",
    "coupling_score": "file coupling",
}


def to_vector(metrics: dict) -> list[float]:
    return [float(metrics.get(name, 0) or 0) for name in FEATURE_NAMES]


def to_matrix(rows: list[dict]) -> list[list[float]]:
    return [to_vector(row) for row in rows]
