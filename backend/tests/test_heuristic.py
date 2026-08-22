from app.ml.heuristic import score_files

LOW_RISK = {
    "churn": 5,
    "commit_frequency": 2,
    "bug_fix_frequency": 0,
    "file_age_days": 400,
    "loc": 50,
    "cyclomatic_complexity": 1.2,
    "developer_count": 1,
    "coupling_score": 0.05,
}

HIGH_RISK = {
    "churn": 2000,
    "commit_frequency": 80,
    "bug_fix_frequency": 25,
    "file_age_days": 30,
    "loc": 900,
    "cyclomatic_complexity": 18.0,
    "developer_count": 9,
    "coupling_score": 0.9,
}


def test_high_risk_scores_above_low_risk():
    results = score_files([LOW_RISK, HIGH_RISK])
    low, high = results
    assert high["defect_probability"] > low["defect_probability"]


def test_empty_input_returns_empty():
    assert score_files([]) == []


def test_feature_contributions_present():
    results = score_files([LOW_RISK, HIGH_RISK])
    for r in results:
        assert set(r["feature_contributions"].keys()) >= {"churn", "bug_fix_frequency", "cyclomatic_complexity"}
