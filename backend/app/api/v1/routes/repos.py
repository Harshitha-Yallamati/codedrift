from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_repository
from app.core.celery_app import celery_app
from app.core.security import decrypt_token
from app.db.session import get_db
from app.models.repository import Repository
from app.models.user import User
from app.schemas.analysis import AnalysisRunRead
from app.schemas.repository import AnalyzeRequest, GitHubRepoOption, RepositoryConnect, RepositoryRead, WebhookInfo
from app.services.github_service import GitHubAPIError, GitHubClient

router = APIRouter(tags=["repositories"])


@router.get("/repos", response_model=list[RepositoryRead])
def list_repos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Repository).filter(Repository.user_id == current_user.id).order_by(Repository.created_at.desc()).all()


@router.get("/repos/github", response_model=list[GitHubRepoOption])
def list_github_repos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.access_token_encrypted:
        raise HTTPException(400, "Connect your GitHub account first (no OAuth token on file)")
    token = decrypt_token(current_user.access_token_encrypted)
    connected_ids = {
        r.github_repo_id
        for r in db.query(Repository).filter(Repository.user_id == current_user.id).all()
        if r.github_repo_id
    }
    try:
        with GitHubClient(token) as gh:
            repos = gh.list_user_repos()
    except GitHubAPIError as exc:
        raise HTTPException(502, f"GitHub API error: {exc}") from exc

    return [
        GitHubRepoOption(
            github_repo_id=r["id"],
            full_name=r["full_name"],
            description=r.get("description"),
            default_branch=r.get("default_branch", "main"),
            private=r.get("private", False),
            language=r.get("language"),
            stars=r.get("stargazers_count", 0),
            already_connected=r["id"] in connected_ids,
        )
        for r in repos
    ]


@router.post("/repos/connect", response_model=RepositoryRead)
def connect_repo(
    payload: RepositoryConnect, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    existing = (
        db.query(Repository)
        .filter(Repository.user_id == current_user.id, Repository.full_name == payload.full_name)
        .first()
    )
    if existing:
        return existing

    repository = Repository(user_id=current_user.id, is_demo=False, **payload.model_dump())
    db.add(repository)
    db.commit()
    db.refresh(repository)
    return repository


@router.get("/repos/{repo_id}", response_model=RepositoryRead)
def get_repo(repository: Repository = Depends(get_owned_repository)):
    return repository


@router.delete("/repos/{repo_id}")
def disconnect_repo(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    if repository.is_demo:
        raise HTTPException(400, "Demo repositories cannot be disconnected")
    db.delete(repository)
    db.commit()
    return {"ok": True}


@router.post("/repos/{repo_id}/analyze", status_code=202)
def analyze_repo(
    payload: AnalyzeRequest, repository: Repository = Depends(get_owned_repository)
):
    if repository.is_demo:
        raise HTTPException(400, "Demo repositories use pre-seeded data and cannot be re-analyzed")
    celery_app.send_task(
        "app.workers.tasks.analyze_repository_task",
        args=[repository.id, payload.branch, payload.trigger],
    )
    return {"status": "queued"}


@router.get("/repos/{repo_id}/analysis-runs", response_model=list[AnalysisRunRead])
def list_runs(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    from app.models.analysis_run import AnalysisRun

    return (
        db.query(AnalysisRun)
        .filter(AnalysisRun.repository_id == repository.id)
        .order_by(AnalysisRun.started_at.desc())
        .all()
    )


@router.get("/repos/{repo_id}/analysis-runs/{run_id}", response_model=AnalysisRunRead)
def get_run(run_id: int, repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    from app.models.analysis_run import AnalysisRun

    run = db.get(AnalysisRun, run_id)
    if not run or run.repository_id != repository.id:
        raise HTTPException(404, "Analysis run not found")
    return run


@router.get("/repos/{repo_id}/webhook-info", response_model=WebhookInfo)
def webhook_info(request: Request, repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    import secrets

    if not repository.webhook_secret:
        repository.webhook_secret = secrets.token_hex(20)
        db.commit()

    base = str(request.base_url).rstrip("/")
    return WebhookInfo(webhook_url=f"{base}/api/v1/webhooks/github", secret=repository.webhook_secret)
