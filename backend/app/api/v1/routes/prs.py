from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.core.celery_app import celery_app
from app.db.session import get_db
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.schemas.pull_request import PRCommentPreview, PullRequestRead

router = APIRouter(tags=["pull-requests"])


@router.get("/repos/{repo_id}/prs", response_model=list[PullRequestRead])
def list_prs(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    return (
        db.query(PullRequest)
        .filter(PullRequest.repository_id == repository.id)
        .order_by(PullRequest.created_at.desc())
        .all()
    )


@router.get("/repos/{repo_id}/prs/{pr_id}", response_model=PullRequestRead)
def get_pr(pr_id: int, repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    pr = db.get(PullRequest, pr_id)
    if not pr or pr.repository_id != repository.id:
        raise HTTPException(404, "Pull request not found")
    return pr


@router.post("/repos/{repo_id}/prs/{pr_number}/analyze", status_code=202)
def analyze_pr(pr_number: int, repository: Repository = Depends(get_owned_repository)):
    if repository.is_demo:
        raise HTTPException(400, "Demo repositories use pre-seeded pull request data")
    celery_app.send_task("app.workers.tasks.analyze_pull_request_task", args=[repository.id, pr_number])
    return {"status": "queued"}


@router.get("/repos/{repo_id}/prs/{pr_id}/comment-preview", response_model=PRCommentPreview)
def comment_preview(pr_id: int, repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    pr = db.get(PullRequest, pr_id)
    if not pr or pr.repository_id != repository.id or not pr.comment_preview:
        raise HTTPException(404, "No comment preview available yet — analyze this PR first")
    return PRCommentPreview(pr_id=pr.id, markdown=pr.comment_preview)
