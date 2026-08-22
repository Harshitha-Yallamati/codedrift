import random

from app.ml.train import should_use_heuristic, train_model


def _synthetic_dataset(n: int = 60):
    random.seed(7)
    rows, labels = [], []
    for i in range(n):
        risky = i % 2 == 0
        rows.append(
            {
                "churn": random.randint(800, 2000) if risky else random.randint(0, 200),
                "commit_frequency": random.randint(30, 80) if risky else random.randint(1, 15),
                "bug_fix_frequency": random.randint(5, 20) if risky else random.randint(0, 2),
                "file_age_days": random.randint(10, 100),
                "loc": random.randint(100, 900),
                "cyclomatic_complexity": random.uniform(8, 20) if risky else random.uniform(1, 4),
                "developer_count": random.randint(1, 8),
                "coupling_score": random.uniform(0.4, 0.9) if risky else random.uniform(0, 0.3),
            }
        )
        labels.append(1 if risky else 0)
    return rows, labels


def test_should_use_heuristic_for_small_or_single_class_data():
    assert should_use_heuristic([1, 0, 1]) is True  # too few samples
    assert should_use_heuristic([1] * 40) is True  # single class


def test_train_model_uses_xgboost_with_enough_data():
    rows, labels = _synthetic_dataset(60)
    result = train_model(rows, labels)
    assert result.used_heuristic is False
    assert result.model is not None
    assert 0.0 <= result.metrics["accuracy"] <= 1.0
    assert result.metrics["roc_auc"] is None or 0.0 <= result.metrics["roc_auc"] <= 1.0
    assert set(result.feature_importance.keys()) == {
        "churn",
        "commit_frequency",
        "bug_fix_frequency",
        "file_age_days",
        "loc",
        "cyclomatic_complexity",
        "developer_count",
        "coupling_score",
    }


def test_train_model_falls_back_to_heuristic_with_no_data():
    result = train_model([], [])
    assert result.used_heuristic is True
    assert result.model is None
