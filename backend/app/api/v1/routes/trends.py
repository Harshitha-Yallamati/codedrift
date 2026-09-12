from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.db.session import get_db
from app.models.repository import Repository
from app.schemas.analysis import TrendsResponse
from app.services import metrics_service

router = APIRouter(tags=["trends"])


@router.get("/repos/{repo_id}/trends", response_model=TrendsResponse)
def get_trends(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    points = metrics_service.get_trends(db, repository.id)
    return TrendsResponse(repository_id=repository.id, points=points, has_sufficient_history=len(points) >= 2)
