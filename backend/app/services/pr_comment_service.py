"""Pull-request risk analysis: scores the files changed in a PR using the
repository's most recent trained model/heuristic, aggregates a PR-level
risk score, and renders the markdown a PR-bot comment would post.

Posting the comment to GitHub is intentionally NOT done here — that needs
a GitHub App or a PAT with pull-request write scope, which is a separate
credential from the read-only OAuth login scope this app requests. This
module is the extension point: wire a `post_comment()` call using the
`markdown` from `build_comment_preview()` once that credential exists.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.ml.predict import categorize
from app.models.file_metric import FileMetric
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.services import metrics_service
from app.services.analysis_service import get_repo_access_token
from app.services.github_service import GitHubClient

RISK_EMOJI = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}


def analyze_pull_request(db: Session, repository: Repository, pr_number: int) -> PullRequest:
    access_token = get_repo_access_token(db, repository)
    with GitHubClient(access_token) as gh:
        pr_data = gh.get_pull_request(repository.full_name, pr_number)
        changed_files = gh.get_pull_request_files(repository.full_name, pr_number)

    latest_run = metrics_service.latest_completed_run(db, repository.id)
    known_predictions: dict[str, tuple[float, str]] = {}
    if latest_run:
        rows = (
            db.query(FileMetric)
            .filter(FileMetric.analysis_run_id == latest_run.id)
            .all()
        )
        for row in rows:
            if row.risk_prediction:
                known_predictions[row.file_path] = (
                    row.risk_prediction.defect_probability,
                    row.risk_prediction.risk_category,
                )

    files_payload = []
    weighted_sum = 0.0
    total_weight = 0.0
    risky_touched = []
    for cf in changed_files:
        path = cf["filename"]
        additions = cf.get("additions", 0)
        deletions = cf.get("deletions", 0)
        weight = max(additions + deletions, 1)
        probability, category = known_predictions.get(path, (None, None))
        is_new = cf.get("status") == "added"

        if probability is not None:
            weighted_sum += probability * weight
            total_weight += weight
            if category in ("high", "critical"):
                risky_touched.append(path)

        files_payload.append(
            {
                "file_path": path,
                "additions": additions,
                "deletions": deletions,
                "defect_probability": probability,
                "risk_category": category,
                "is_new_file": is_new,
            }
        )

    pr_probability = (weighted_sum / total_weight) if total_weight > 0 else 0.0
    pr_category = categorize(pr_probability)
    pr_score = round(pr_probability * 100, 1)

    if risky_touched:
        summary = (
            f"This PR touches {len(risky_touched)} file(s) with a history of elevated defect risk "
            f"({', '.join(risky_touched[:5])}{'...' if len(risky_touched) > 5 else ''}). "
            f"Overall PR risk is {pr_category} ({pr_score:.0f}/100)."
        )
    else:
        summary = f"This PR's changed files don't overlap with known high-risk areas. Overall PR risk is {pr_category} ({pr_score:.0f}/100)."

    pr_record = (
        db.query(PullRequest)
        .filter(PullRequest.repository_id == repository.id, PullRequest.pr_number == pr_number)
        .first()
    )
    if not pr_record:
        pr_record = PullRequest(repository_id=repository.id, pr_number=pr_number)
        db.add(pr_record)

    pr_record.title = pr_data.get("title", f"PR #{pr_number}")
    pr_record.author = (pr_data.get("user") or {}).get("login")
    pr_record.state = "merged" if pr_data.get("merged") else pr_data.get("state", "open")
    pr_record.base_branch = (pr_data.get("base") or {}).get("ref")
    pr_record.head_branch = (pr_data.get("head") or {}).get("ref")
    pr_record.risk_score = pr_score
    pr_record.risk_category = pr_category
    pr_record.files_changed = files_payload
    pr_record.summary = summary
    pr_record.comment_preview = build_comment_preview(pr_score, pr_category, files_payload, summary)
    pr_record.analyzed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pr_record)
    return pr_record


def build_comment_preview(pr_score: float, pr_category: str, files_payload: list[dict], summary: str) -> str:
    lines = [
        f"## {RISK_EMOJI.get(pr_category, '⚪')} CodeDrift Risk Analysis",
        "",
        f"**Overall risk: {pr_category.upper()} ({pr_score:.0f}/100)**",
        "",
        summary,
        "",
        "| File | Risk | Defect Probability |",
        "|---|---|---|",
    ]
    scored = [f for f in files_payload if f["defect_probability"] is not None]
    scored.sort(key=lambda f: f["defect_probability"], reverse=True)
    for f in scored[:10]:
        emoji = RISK_EMOJI.get(f["risk_category"], "⚪")
        lines.append(f"| `{f['file_path']}` | {emoji} {f['risk_category']} | {f['defect_probability']:.0%} |")
    if not scored:
        lines.append("| _no historical risk data for these files yet_ | — | — |")
    lines += ["", "_Generated by [CodeDrift](https://github.com) — ML-powered codebase health monitoring._"]
    return "\n".join(lines)
