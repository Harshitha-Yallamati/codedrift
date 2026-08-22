from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.db.session import get_db
from app.models.analysis_run import AnalysisRun
from app.models.repository import Repository
from app.schemas.analysis import AnalyticsResponse
from app.services import metrics_service

router = APIRouter(tags=["analytics"])


@router.get("/repos/{repo_id}/analytics", response_model=AnalyticsResponse)
def get_analytics(
    repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db), run_id: int | None = None
):
    run = db.get(AnalysisRun, run_id) if run_id else metrics_service.latest_completed_run(db, repository.id)
    if not run or run.repository_id != repository.id:
        raise HTTPException(404, "No completed analysis run found for this repository")
    return metrics_service.get_analytics(db, repository.id, run)
