"""Read-side aggregations for the dashboard, file explorer, trends, and
analytics pages. Pure DB queries over already-computed analysis results —
no GitHub calls or ML here.
"""

from statistics import mean, pstdev

from sqlalchemy.orm import Session, joinedload

from app.ml.features import FEATURE_NAMES
from app.models.analysis_run import AnalysisRun
from app.models.file_metric import FileMetric
from app.models.repository import Repository

RISK_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def latest_completed_run(db: Session, repository_id: int) -> AnalysisRun | None:
    return (
        db.query(AnalysisRun)
        .filter(AnalysisRun.repository_id == repository_id, AnalysisRun.status == "completed")
        .order_by(AnalysisRun.finished_at.desc())
        .first()
    )


def get_health_summary(db: Session, repository: Repository, run: AnalysisRun | None = None) -> dict:
    run = run or latest_completed_run(db, repository.id)
    if not run:
        return {
            "repository_id": repository.id,
            "health_score": 0.0,
            "risk_category_counts": {"low": 0, "medium": 0, "high": 0, "critical": 0},
            "total_files": 0,
            "model_type": None,
            "model_version": None,
            "last_analyzed_at": None,
            "top_risky_files": [],
        }

    files = (
        db.query(FileMetric)
        .options(joinedload(FileMetric.risk_prediction))
        .filter(FileMetric.analysis_run_id == run.id)
        .all()
    )
    counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for f in files:
        if f.risk_prediction:
            counts[f.risk_prediction.risk_category] = counts.get(f.risk_prediction.risk_category, 0) + 1

    top_risky = sorted(
        [f for f in files if f.risk_prediction],
        key=lambda f: f.risk_prediction.defect_probability,
        reverse=True,
    )[:10]

    return {
        "repository_id": repository.id,
        "health_score": run.health_score or 0.0,
        "risk_category_counts": counts,
        "total_files": len(files),
        "model_type": run.model_type,
        "model_version": run.model_version,
        "last_analyzed_at": run.finished_at,
        "top_risky_files": top_risky,
    }


def get_file_list(
    db: Session,
    repository: Repository,
    run: AnalysisRun,
    folder: str | None = None,
    file_type: str | None = None,
    risk_level: str | None = None,
    sort: str = "risk_desc",
) -> list[FileMetric]:
    query = (
        db.query(FileMetric)
        .options(joinedload(FileMetric.risk_prediction))
        .filter(FileMetric.analysis_run_id == run.id)
    )
    if folder:
        query = query.filter(FileMetric.file_path.ilike(f"{folder}%"))
    if file_type:
        query = query.filter(FileMetric.file_path.ilike(f"%.{file_type.lstrip('.')}"))

    files = query.all()

    if risk_level:
        files = [f for f in files if f.risk_prediction and f.risk_prediction.risk_category == risk_level]

    if sort == "risk_desc":
        files.sort(key=lambda f: f.risk_prediction.defect_probability if f.risk_prediction else 0, reverse=True)
    elif sort == "risk_asc":
        files.sort(key=lambda f: f.risk_prediction.defect_probability if f.risk_prediction else 0)
    elif sort == "churn_desc":
        files.sort(key=lambda f: f.churn, reverse=True)
    elif sort == "complexity_desc":
        files.sort(key=lambda f: f.cyclomatic_complexity, reverse=True)

    return files


def get_file_history(db: Session, repository_id: int, file_path: str) -> list[FileMetric]:
    return (
        db.query(FileMetric)
        .options(joinedload(FileMetric.risk_prediction), joinedload(FileMetric.analysis_run))
        .join(AnalysisRun, FileMetric.analysis_run_id == AnalysisRun.id)
        .filter(
            FileMetric.repository_id == repository_id,
            FileMetric.file_path == file_path,
            AnalysisRun.status == "completed",
        )
        .order_by(AnalysisRun.finished_at.asc())
        .all()
    )


def get_trends(db: Session, repository_id: int) -> list[dict]:
    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.repository_id == repository_id, AnalysisRun.status == "completed")
        .order_by(AnalysisRun.finished_at.asc())
        .all()
    )
    points = []
    for run in runs:
        files = (
            db.query(FileMetric)
            .options(joinedload(FileMetric.risk_prediction))
            .filter(FileMetric.analysis_run_id == run.id)
            .all()
        )
        counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for f in files:
            if f.risk_prediction:
                counts[f.risk_prediction.risk_category] += 1
        points.append(
            {
                "run_id": run.id,
                "started_at": run.started_at,
                "health_score": run.health_score,
                "avg_churn": round(mean([f.churn for f in files]), 2) if files else 0,
                "avg_complexity": round(mean([f.cyclomatic_complexity for f in files]), 2) if files else 0,
                "critical_count": counts["critical"],
                "high_count": counts["high"],
                "medium_count": counts["medium"],
                "low_count": counts["low"],
                "files_analyzed": run.files_analyzed,
            }
        )
    return points


def get_analytics(db: Session, repository_id: int, run: AnalysisRun) -> dict:
    files = (
        db.query(FileMetric)
        .options(joinedload(FileMetric.risk_prediction))
        .filter(FileMetric.analysis_run_id == run.id)
        .all()
    )
    files = [f for f in files if f.risk_prediction]

    correlations = []
    if len(files) >= 3:
        risk_values = [f.risk_prediction.defect_probability for f in files]
        for feature in FEATURE_NAMES:
            metric_values = [getattr(f, feature) for f in files]
            correlations.append({"metric": feature, "correlation_with_risk": _pearson(metric_values, risk_values)})

    return {
        "repository_id": repository_id,
        "run_id": run.id,
        "model_type": run.model_type,
        "accuracy": run.accuracy,
        "precision": run.precision,
        "recall": run.recall,
        "f1_score": run.f1_score,
        "roc_auc": run.roc_auc,
        "training_samples": run.training_samples,
        "feature_importance": run.feature_importance or {},
        "correlations": correlations,
    }


def _pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 3:
        return 0.0
    mx, my = mean(xs), mean(ys)
    sx, sy = pstdev(xs), pstdev(ys)
    if sx == 0 or sy == 0:
        return 0.0
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / n
    return round(cov / (sx * sy), 4)
