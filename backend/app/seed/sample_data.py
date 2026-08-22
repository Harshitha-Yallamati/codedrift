"""Populates demo data so the dashboard is fully explorable without a
GitHub connection. Run with: python -m app.seed.sample_data
"""

import random
from datetime import datetime, timedelta, timezone

from app.analysis.bugfix_classifier import is_bug_fix_commit
from app.analysis.complexity import detect_language
from app.db.session import SessionLocal
from app.ml.explain import generate_explanation
from app.ml.heuristic import HEURISTIC_MODEL_VERSION, score_files
from app.ml.predict import categorize
from app.models.analysis_run import AnalysisRun
from app.models.commit import Commit
from app.models.file_metric import FileMetric
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.risk_prediction import RiskPrediction
from app.models.user import User

random.seed(42)

COMMIT_TEMPLATES = [
    "feat: add {thing} to {area}",
    "feat({area}): support {thing}",
    "fix: resolve crash when {thing} is null in {area}",
    "fix({area}): correct off-by-one error in {thing}",
    "fix: patch race condition in {area}",
    "refactor: simplify {thing} handling in {area}",
    "refactor({area}): extract {thing} helper",
    "chore: bump dependencies for {area}",
    "docs: document {thing} behavior",
    "test: add coverage for {thing} in {area}",
    "fix: bug causing {thing} to fail under load",
    "perf: speed up {thing} lookups in {area}",
    "style: reformat {area}",
    "fix: hotfix for {area} outage",
]
THINGS = ["pagination", "retry logic", "auth tokens", "caching", "rate limiting", "validation", "serialization", "webhook delivery", "session handling", "error messages"]
AREAS = ["api layer", "database module", "payment flow", "user service", "billing", "notifications", "search index", "sync worker"]
AUTHORS = [
    ("Priya Nair", "priya@codedrift.dev"),
    ("Marcus Chen", "marcus@codedrift.dev"),
    ("Elena Rossi", "elena@codedrift.dev"),
    ("Sam O'Connor", "sam@codedrift.dev"),
    ("Aisha Bello", "aisha@codedrift.dev"),
    ("Diego Alvarez", "diego@codedrift.dev"),
]

REPO_SPECS = [
    {
        "full_name": "codedrift-demo/apex-commerce-api",
        "description": "Core order & checkout API for the Apex commerce platform.",
        "language": "Python",
        "ext": ".py",
        "stars": 142,
        "profile": "healthy",
        "folders": ["src/api/routes", "src/services", "src/models", "src/utils", "tests"],
        "debt_folder": None,
    },
    {
        "full_name": "codedrift-demo/pulse-analytics-dashboard",
        "description": "Internal analytics dashboard for product usage metrics.",
        "language": "TypeScript",
        "ext": ".tsx",
        "stars": 58,
        "profile": "moderate",
        "folders": ["src/components", "src/pages", "src/hooks", "src/lib", "src/legacy"],
        "debt_folder": "src/legacy",
    },
    {
        "full_name": "codedrift-demo/nimbus-mobile-sdk",
        "description": "Cross-platform mobile SDK powering the Nimbus app's offline sync and payments.",
        "language": "Go",
        "ext": ".go",
        "stars": 231,
        "profile": "debt-heavy",
        "folders": ["sync", "payments/legacy", "payments", "auth", "storage"],
        "debt_folder": "payments/legacy",
    },
]

FILE_NAMES = ["client", "handler", "manager", "service", "controller", "processor", "adapter", "validator", "resolver", "worker", "gateway", "cache", "index", "utils", "config"]


def _rand_commit_message() -> str:
    template = random.choice(COMMIT_TEMPLATES)
    return template.format(thing=random.choice(THINGS), area=random.choice(AREAS))


def _synth_files(spec: dict) -> list[str]:
    files = []
    count = random.randint(40, 90)
    for _ in range(count):
        folder = random.choice(spec["folders"])
        name = random.choice(FILE_NAMES)
        suffix = random.randint(1, 999)
        files.append(f"{folder}/{name}_{suffix}{spec['ext']}")
    return list(dict.fromkeys(files))


def _synth_commits(repo_id: int, file_paths: list[str], profile: str, debt_folder: str | None) -> list[Commit]:
    now = datetime.now(timezone.utc)
    n_commits = random.randint(150, 400)
    commits = []
    for i in range(n_commits):
        days_ago = random.uniform(0, 540)
        committed_at = now - timedelta(days=days_ago)
        author_name, author_email = random.choice(AUTHORS)
        message = _rand_commit_message()
        bug_fix = is_bug_fix_commit(message)

        if debt_folder and random.random() < 0.35:
            touched = [f for f in file_paths if f.startswith(debt_folder)]
        else:
            touched = file_paths
        n_files = random.randint(1, 4)
        files_touched = random.sample(touched, min(n_files, len(touched))) if touched else []

        additions = random.randint(2, 180)
        deletions = random.randint(0, 120)

        commits.append(
            Commit(
                repository_id=repo_id,
                sha=f"{i:04d}{random.randbytes(16).hex()}"[:40],
                author_name=author_name,
                author_email=author_email,
                message=message,
                is_bug_fix=bug_fix,
                additions=additions,
                deletions=deletions,
                files_changed=len(files_touched),
                branch="main",
                committed_at=committed_at,
            )
        )
        commits[-1]._touched_files = files_touched  # type: ignore[attr-defined]
    return commits


def _build_raw_metrics(file_paths: list[str], commits: list[Commit], now: datetime, debt_folder: str | None, ext: str) -> dict[str, dict]:
    metrics: dict[str, dict] = {
        path: {
            "churn": 0,
            "commit_frequency": 0,
            "bug_fix_frequency": 0,
            "developers": set(),
            "first_seen": now,
            "loc": random.randint(30, 600),
            "cyclomatic_complexity": round(random.uniform(1.0, 6.0), 2),
            "coupling_score": round(random.uniform(0.05, 0.4), 3),
        }
        for path in file_paths
    }

    for c in commits:
        touched = getattr(c, "_touched_files", [])
        for path in touched:
            if path not in metrics:
                continue
            m = metrics[path]
            m["churn"] += c.additions + c.deletions
            m["commit_frequency"] += 1
            if c.is_bug_fix:
                m["bug_fix_frequency"] += 1
            m["developers"].add(c.author_name)
            if c.committed_at < m["first_seen"]:
                m["first_seen"] = c.committed_at

    for path, m in metrics.items():
        is_debt = debt_folder and path.startswith(debt_folder)
        if is_debt:
            m["churn"] = int(m["churn"] * random.uniform(1.6, 2.4)) + random.randint(200, 800)
            m["bug_fix_frequency"] += random.randint(3, 12)
            m["cyclomatic_complexity"] = round(random.uniform(8.0, 22.0), 2)
            m["coupling_score"] = round(random.uniform(0.45, 0.9), 3)
            m["loc"] = random.randint(300, 1200)

        m["file_age_days"] = max((now - m["first_seen"]).days, 1)
        m["developer_count"] = max(len(m["developers"]), 1)
        m["language"] = detect_language(path) or ("Python" if ext == ".py" else "unknown")
        m["complexity_method"] = "ast" if ext == ".py" and random.random() < 0.85 else "heuristic"
        del m["developers"]
        del m["first_seen"]

    return metrics


def _create_analysis_run(db, repository: Repository, raw_metrics: dict[str, dict], model_type: str, started_at: datetime, commit_sha: str) -> AnalysisRun:
    rows = [raw_metrics[p] for p in raw_metrics]
    paths = list(raw_metrics.keys())

    scored = score_files(rows)

    run = AnalysisRun(
        repository_id=repository.id,
        branch="main",
        status="completed",
        trigger="manual",
        commit_sha=commit_sha,
        model_type=model_type,
        model_version=HEURISTIC_MODEL_VERSION if model_type == "heuristic" else "xgboost-v1-demo",
        files_analyzed=len(paths),
        training_samples=random.randint(80, 300),
        started_at=started_at,
        finished_at=started_at + timedelta(minutes=random.randint(2, 9)),
    )
    if model_type == "xgboost":
        run.accuracy = round(random.uniform(0.78, 0.91), 4)
        run.precision = round(random.uniform(0.7, 0.88), 4)
        run.recall = round(random.uniform(0.65, 0.85), 4)
        run.f1_score = round(random.uniform(0.7, 0.86), 4)
        run.roc_auc = round(random.uniform(0.76, 0.92), 4)
        weights = [0.24, 0.11, 0.27, 0.05, 0.08, 0.17, 0.06, 0.02]
        run.feature_importance = dict(
            zip(
                ["churn", "commit_frequency", "bug_fix_frequency", "file_age_days", "loc", "cyclomatic_complexity", "developer_count", "coupling_score"],
                weights,
            )
        )

    db.add(run)
    db.flush()

    probabilities = []
    for path, prediction in zip(paths, scored):
        probability = prediction["defect_probability"]
        category = categorize(probability)
        probabilities.append(probability)
        m = raw_metrics[path]

        fm = FileMetric(
            analysis_run_id=run.id,
            repository_id=repository.id,
            file_path=path,
            language=m["language"],
            churn=m["churn"],
            commit_frequency=m["commit_frequency"],
            bug_fix_frequency=m["bug_fix_frequency"],
            file_age_days=m["file_age_days"],
            loc=m["loc"],
            cyclomatic_complexity=m["cyclomatic_complexity"],
            developer_count=m["developer_count"],
            coupling_score=m["coupling_score"],
            complexity_method=m["complexity_method"],
        )
        db.add(fm)
        db.flush()

        explanation = generate_explanation(category, probability, prediction["feature_contributions"], m, model_type)
        db.add(
            RiskPrediction(
                file_metric_id=fm.id,
                defect_probability=probability,
                risk_category=category,
                model_type=model_type,
                model_version=run.model_version,
                explanation=explanation,
                feature_contributions=prediction["feature_contributions"],
            )
        )

    health_score = round(100 * (1 - (sum(probabilities) / len(probabilities) if probabilities else 0)), 1)
    run.health_score = health_score
    db.flush()
    return run


def _create_pull_requests(db, repository: Repository, latest_run: AnalysisRun, file_paths: list[str]) -> None:
    latest_files = {
        fm.file_path: fm.risk_prediction
        for fm in db.query(FileMetric).filter(FileMetric.analysis_run_id == latest_run.id).all()
        if fm.risk_prediction
    }
    pr_titles = [
        "Add retry logic to sync worker",
        "Fix null pointer in checkout handler",
        "Refactor payment gateway client",
        "Improve caching for product lookups",
        "Patch race condition in webhook delivery",
        "Add pagination to admin API",
    ]
    for i, title in enumerate(random.sample(pr_titles, min(len(pr_titles), 5)), start=1):
        touched_paths = random.sample(file_paths, min(random.randint(2, 5), len(file_paths)))
        files_changed = []
        weighted_sum, total_weight = 0.0, 0.0
        for path in touched_paths:
            rp = latest_files.get(path)
            additions, deletions = random.randint(5, 120), random.randint(0, 60)
            weight = additions + deletions
            prob = rp.defect_probability if rp else None
            if prob is not None:
                weighted_sum += prob * weight
                total_weight += weight
            files_changed.append(
                {
                    "file_path": path,
                    "additions": additions,
                    "deletions": deletions,
                    "defect_probability": prob,
                    "risk_category": rp.risk_category if rp else None,
                    "is_new_file": random.random() < 0.15,
                }
            )
        pr_probability = (weighted_sum / total_weight) if total_weight > 0 else 0.1
        pr_score = round(pr_probability * 100, 1)
        pr_category = categorize(pr_probability)
        summary = f"This PR touches {len(touched_paths)} file(s); overall predicted risk is {pr_category} ({pr_score:.0f}/100)."

        lines = [
            "## CodeDrift Risk Analysis",
            "",
            f"**Overall risk: {pr_category.upper()} ({pr_score:.0f}/100)**",
            "",
            summary,
            "",
            "| File | Risk | Defect Probability |",
            "|---|---|---|",
        ]
        for f in sorted([f for f in files_changed if f["defect_probability"] is not None], key=lambda f: f["defect_probability"], reverse=True)[:8]:
            lines.append(f"| `{f['file_path']}` | {f['risk_category']} | {f['defect_probability']:.0%} |")
        lines += ["", "_Generated by CodeDrift — ML-powered codebase health monitoring._"]

        db.add(
            PullRequest(
                repository_id=repository.id,
                pr_number=100 + i,
                title=title,
                author=random.choice(AUTHORS)[0],
                state=random.choice(["open", "open", "merged"]),
                base_branch="main",
                head_branch=f"feature/{title.lower().replace(' ', '-')[:30]}",
                risk_score=pr_score,
                risk_category=pr_category,
                files_changed=files_changed,
                summary=summary,
                comment_preview="\n".join(lines),
                analyzed_at=datetime.now(timezone.utc),
            )
        )


def seed(force: bool = False) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "demo").first()
        if not user:
            user = User(username="demo", email="demo@codedrift.dev", is_demo=True)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            existing_count = db.query(Repository).filter(Repository.user_id == user.id).count()
            if existing_count >= len(REPO_SPECS) and not force:
                print(f"Demo data already present ({existing_count} repos) — skipping reseed.")
                return
            db.query(Repository).filter(Repository.user_id == user.id).delete()
            db.commit()

        summary = []
        for spec in REPO_SPECS:
            repository = Repository(
                user_id=user.id,
                full_name=spec["full_name"],
                description=spec["description"],
                default_branch="main",
                private=False,
                language=spec["language"],
                stars=spec["stars"],
                is_demo=True,
            )
            db.add(repository)
            db.commit()
            db.refresh(repository)

            file_paths = _synth_files(spec)
            commits = _synth_commits(repository.id, file_paths, spec["profile"], spec["debt_folder"])
            commits.sort(key=lambda c: c.committed_at, reverse=True)
            for c in commits:
                db.add(c)
            db.commit()

            now = datetime.now(timezone.utc)
            older_cutoff = now - timedelta(days=30)
            older_commits = [c for c in commits if c.committed_at <= older_cutoff]
            older_metrics = _build_raw_metrics(file_paths, older_commits, older_cutoff, spec["debt_folder"], spec["ext"])
            _create_analysis_run(db, repository, older_metrics, "heuristic", older_cutoff - timedelta(days=1), commits[0].sha)
            db.commit()

            current_metrics = _build_raw_metrics(file_paths, commits, now, spec["debt_folder"], spec["ext"])
            latest_run = _create_analysis_run(db, repository, current_metrics, "xgboost", now - timedelta(hours=2), commits[0].sha)
            db.commit()

            counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
            for fm in db.query(FileMetric).filter(FileMetric.analysis_run_id == latest_run.id).all():
                if fm.risk_prediction:
                    counts[fm.risk_prediction.risk_category] += 1

            repository.health_score = latest_run.health_score
            repository.risk_category_counts = counts
            repository.latest_run_id = latest_run.id
            repository.last_analyzed_at = latest_run.finished_at
            db.commit()

            _create_pull_requests(db, repository, latest_run, file_paths)
            db.commit()

            summary.append((repository.full_name, repository.health_score))

        print("Seeded demo data:")
        for name, score in summary:
            print(f"  {name}: health score {score}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
