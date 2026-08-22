"""Orchestrates a full repository analysis run: fetch commit history from
GitHub, compute file-level metrics, train (or fall back to heuristic) the
defect-risk model, predict, explain, and persist everything.

Used both for a user-triggered "Analyze" click and for webhook-triggered
re-analysis after new commits/PRs.
"""

import logging
from datetime import datetime, timezone
from statistics import mean

from sqlalchemy.orm import Session

from app.analysis.bugfix_classifier import is_bug_fix_commit
from app.analysis.churn import FileHistory, FileTouch, build_file_histories
from app.analysis.complexity import compute_complexity, detect_language
from app.analysis.coupling import compute_coupling_scores
from app.core.security import decrypt_token
from app.ml import heuristic as heuristic_ml
from app.ml import model_registry
from app.ml.explain import generate_explanation
from app.ml.predict import categorize, predict_with_model
from app.ml.train import XGBOOST_MODEL_VERSION, train_model
from app.ml.heuristic import HEURISTIC_MODEL_VERSION
from app.models.analysis_run import AnalysisRun
from app.models.commit import Commit
from app.models.file_metric import FileMetric
from app.models.repository import Repository
from app.models.risk_prediction import RiskPrediction
from app.models.user import User
from app.services.github_service import GitHubAPIError, GitHubClient

logger = logging.getLogger(__name__)

MAX_COMMITS = 400
MAX_FILES_ANALYZED = 200
MAX_FILES_WITH_CONTENT_FETCH = 120


def get_repo_access_token(db: Session, repository: Repository) -> str | None:
    user = db.get(User, repository.user_id)
    if user and user.access_token_encrypted:
        return decrypt_token(user.access_token_encrypted)
    return None


def run_analysis(db: Session, repository: Repository, branch: str | None = None, trigger: str = "manual") -> AnalysisRun:
    branch = branch or repository.default_branch or "main"
    run = AnalysisRun(repository_id=repository.id, branch=branch, status="running", trigger=trigger)
    db.add(run)
    db.commit()  # persist the "running" row immediately so it survives any later rollback
    db.refresh(run)

    try:
        if repository.is_demo:
            raise RuntimeError("Demo repositories are seeded directly and should not be re-analyzed live.")

        access_token = get_repo_access_token(db, repository)
        with GitHubClient(access_token) as gh:
            raw_commits = gh.list_commits(repository.full_name, branch, max_commits=MAX_COMMITS)
            if not raw_commits:
                raise RuntimeError("No commits found on this branch.")

            head_sha = raw_commits[0]["sha"]
            commit_touches: list[tuple[str, list[str], FileTouch]] = []
            commit_file_lists: list[list[str]] = []
            existing_shas = {
                row[0]
                for row in db.query(Commit.sha).filter(Commit.repository_id == repository.id).all()
            }

            for c in raw_commits:
                sha = c["sha"]
                message = (c.get("commit") or {}).get("message", "")
                author = (c.get("commit") or {}).get("author") or {}
                author_name = author.get("name") or (c.get("author") or {}).get("login") or "unknown"
                author_email = author.get("email")
                committed_at_raw = author.get("date")
                committed_at = (
                    datetime.fromisoformat(committed_at_raw.replace("Z", "+00:00"))
                    if committed_at_raw
                    else datetime.now(timezone.utc)
                )
                bug_fix = is_bug_fix_commit(message)

                detail = gh.get_commit_detail(repository.full_name, sha)
                files = detail.get("files") or []
                file_paths = [f["filename"] for f in files]

                if sha not in existing_shas:
                    db.add(
                        Commit(
                            repository_id=repository.id,
                            sha=sha,
                            author_name=author_name,
                            author_email=author_email,
                            message=message[:4000],
                            is_bug_fix=bug_fix,
                            additions=detail.get("stats", {}).get("additions", 0),
                            deletions=detail.get("stats", {}).get("deletions", 0),
                            files_changed=len(file_paths),
                            branch=branch,
                            committed_at=committed_at,
                        )
                    )
                    existing_shas.add(sha)

                for f in files:
                    touch = FileTouch(
                        sha=sha,
                        author=author_name,
                        committed_at=committed_at,
                        additions=f.get("additions", 0),
                        deletions=f.get("deletions", 0),
                        is_bug_fix=bug_fix,
                    )
                    commit_touches.append((sha, [f["filename"]], touch))
                commit_file_lists.append(file_paths)

            db.flush()

            histories = build_file_histories(commit_touches)
            coupling_scores = compute_coupling_scores(commit_file_lists)

            ranked_paths = sorted(histories.keys(), key=lambda p: histories[p].churn, reverse=True)
            target_paths = ranked_paths[:MAX_FILES_ANALYZED]

            now = datetime.now(timezone.utc)
            raw_metrics: dict[str, dict] = {}
            for path in target_paths:
                hist = histories[path]
                raw_metrics[path] = {
                    "churn": hist.churn,
                    "commit_frequency": hist.commit_frequency,
                    "bug_fix_frequency": hist.bug_fix_frequency,
                    "file_age_days": hist.age_days(now),
                    "developer_count": hist.developer_count,
                    "coupling_score": coupling_scores.get(path, 0.0),
                    "language": detect_language(path),
                }

            for i, path in enumerate(target_paths[:MAX_FILES_WITH_CONTENT_FETCH]):
                content = gh.get_file_content(repository.full_name, path, head_sha)
                if content is not None:
                    result = compute_complexity(path, content)
                    raw_metrics[path]["loc"] = result.loc
                    raw_metrics[path]["cyclomatic_complexity"] = result.complexity
                    raw_metrics[path]["complexity_method"] = result.method
                else:
                    raw_metrics[path]["loc"] = 0
                    raw_metrics[path]["cyclomatic_complexity"] = 0.0
                    raw_metrics[path]["complexity_method"] = "heuristic"
            for path in target_paths[MAX_FILES_WITH_CONTENT_FETCH:]:
                raw_metrics[path]["loc"] = 0
                raw_metrics[path]["cyclomatic_complexity"] = 0.0
                raw_metrics[path]["complexity_method"] = "heuristic"

            train_result = _train_from_temporal_split(raw_commits, histories, coupling_scores, now)

            if train_result.used_heuristic:
                scored = heuristic_ml.score_files([raw_metrics[p] for p in target_paths])
                model_type = "heuristic"
                model_version = HEURISTIC_MODEL_VERSION
            else:
                scored = predict_with_model(train_result.model, [raw_metrics[p] for p in target_paths])
                model_type = "xgboost"
                model_version = f"{XGBOOST_MODEL_VERSION}-run{run.id}"
                model_registry.save_model(repository.id, run.id, train_result.model)

            risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
            probabilities = []
            for path, prediction in zip(target_paths, scored):
                probability = prediction["defect_probability"]
                category = categorize(probability)
                risk_counts[category] += 1
                probabilities.append(probability)

                fm = FileMetric(
                    analysis_run_id=run.id,
                    repository_id=repository.id,
                    file_path=path,
                    language=raw_metrics[path]["language"],
                    churn=raw_metrics[path]["churn"],
                    commit_frequency=raw_metrics[path]["commit_frequency"],
                    bug_fix_frequency=raw_metrics[path]["bug_fix_frequency"],
                    file_age_days=raw_metrics[path]["file_age_days"],
                    loc=raw_metrics[path]["loc"],
                    cyclomatic_complexity=raw_metrics[path]["cyclomatic_complexity"],
                    developer_count=raw_metrics[path]["developer_count"],
                    coupling_score=raw_metrics[path]["coupling_score"],
                    complexity_method=raw_metrics[path]["complexity_method"],
                )
                db.add(fm)
                db.flush()

                explanation = generate_explanation(
                    category, probability, prediction["feature_contributions"], raw_metrics[path], model_type
                )
                db.add(
                    RiskPrediction(
                        file_metric_id=fm.id,
                        defect_probability=probability,
                        risk_category=category,
                        model_type=model_type,
                        model_version=model_version,
                        explanation=explanation,
                        feature_contributions=prediction["feature_contributions"],
                    )
                )

            health_score = round(100 * (1 - (mean(probabilities) if probabilities else 0)), 1)

            run.status = "completed"
            run.commit_sha = head_sha
            run.model_type = model_type
            run.model_version = model_version
            run.health_score = health_score
            run.files_analyzed = len(target_paths)
            run.training_samples = train_result.training_samples
            if not train_result.used_heuristic:
                run.accuracy = train_result.metrics.get("accuracy")
                run.precision = train_result.metrics.get("precision")
                run.recall = train_result.metrics.get("recall")
                run.f1_score = train_result.metrics.get("f1_score")
                run.roc_auc = train_result.metrics.get("roc_auc")
                run.feature_importance = train_result.feature_importance
            run.finished_at = datetime.now(timezone.utc)

            repository.health_score = health_score
            repository.risk_category_counts = risk_counts
            repository.latest_run_id = run.id
            repository.last_analyzed_at = run.finished_at

            db.commit()
            db.refresh(run)
            return run

    except GitHubAPIError as exc:
        db.rollback()
        run = db.get(AnalysisRun, run.id) or run
        run.status = "failed"
        run.error_message = str(exc)[:2000]
        run.finished_at = datetime.now(timezone.utc)
        db.add(run)
        db.commit()
        return run
    except Exception as exc:  # noqa: BLE001
        logger.exception("Analysis run %s failed", run.id)
        db.rollback()
        run = db.get(AnalysisRun, run.id) or run
        run.status = "failed"
        run.error_message = str(exc)[:2000]
        run.finished_at = datetime.now(timezone.utc)
        db.add(run)
        db.commit()
        return run


def _train_from_temporal_split(raw_commits: list[dict], histories: dict[str, FileHistory], coupling_scores: dict, now: datetime):
    """Splits commit history in time to build leakage-free training data:
    features from the older ~70% of commits, labels from whether a file was
    touched by a bug-fix commit in the newer ~30%.
    """
    if len(raw_commits) < 10:
        return train_model([], [])

    # raw_commits is newest-first (GitHub API order); reverse to oldest-first
    ordered = list(reversed(raw_commits))
    cutoff_index = int(len(ordered) * 0.7)
    label_window = ordered[cutoff_index:]

    cutoff_time = None
    if label_window:
        author = (label_window[0].get("commit") or {}).get("author") or {}
        raw_date = author.get("date")
        if raw_date:
            cutoff_time = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))

    feature_rows = []
    labels = []
    for path, hist in histories.items():
        before = [t for t in hist.touches if cutoff_time is None or t.committed_at < cutoff_time]
        after = [t for t in hist.touches if cutoff_time is not None and t.committed_at >= cutoff_time]
        if not before:
            continue
        touched_by_bugfix_after = any(t.is_bug_fix for t in after)

        feature_rows.append(
            {
                "churn": sum(t.additions + t.deletions for t in before),
                "commit_frequency": len(before),
                "bug_fix_frequency": sum(1 for t in before if t.is_bug_fix),
                "file_age_days": max((now - min(t.committed_at for t in before)).days, 0),
                "loc": 0,
                "cyclomatic_complexity": 0.0,
                "developer_count": len({t.author for t in before}),
                "coupling_score": coupling_scores.get(path, 0.0),
            }
        )
        labels.append(1 if touched_by_bugfix_after else 0)

    return train_model(feature_rows, labels)
