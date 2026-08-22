from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.db.session import get_db
from app.models.repository import Repository
from app.schemas.analysis import HealthSummary
from app.services import metrics_service

router = APIRouter(tags=["dashboard"])


@router.get("/repos/{repo_id}/health", response_model=HealthSummary)
def get_health(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    return metrics_service.get_health_summary(db, repository)
