from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.db.session import get_db
from app.models.analysis_run import AnalysisRun
from app.models.file_metric import FileMetric
from app.models.repository import Repository
from app.schemas.file_metric import FileDetailResponse, FileHistoryPoint, FileListResponse
from app.services import metrics_service

router = APIRouter(tags=["files"])


@router.get("/repos/{repo_id}/files", response_model=FileListResponse)
def list_files(
    repository: Repository = Depends(get_owned_repository),
    db: Session = Depends(get_db),
    run_id: int | None = None,
    folder: str | None = None,
    file_type: str | None = None,
    risk_level: str | None = None,
    sort: str = "risk_desc",
):
    run = db.get(AnalysisRun, run_id) if run_id else metrics_service.latest_completed_run(db, repository.id)
    if not run or run.repository_id != repository.id:
        raise HTTPException(404, "No completed analysis run found for this repository")

    files = metrics_service.get_file_list(db, repository, run, folder, file_type, risk_level, sort)
    return FileListResponse(repository_id=repository.id, run_id=run.id, total=len(files), files=files)


@router.get("/repos/{repo_id}/files/{file_metric_id}", response_model=FileDetailResponse)
def get_file_detail(
    file_metric_id: int, repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)
):
    file_metric = db.get(FileMetric, file_metric_id)
    if not file_metric or file_metric.repository_id != repository.id:
        raise HTTPException(404, "File not found")

    history_rows = metrics_service.get_file_history(db, repository.id, file_metric.file_path)
    history = [
        FileHistoryPoint(
            run_id=row.analysis_run_id,
            started_at=row.analysis_run.started_at,
            defect_probability=row.risk_prediction.defect_probability if row.risk_prediction else None,
            risk_category=row.risk_prediction.risk_category if row.risk_prediction else None,
            churn=row.churn,
            cyclomatic_complexity=row.cyclomatic_complexity,
        )
        for row in history_rows
    ]
    return FileDetailResponse(file=file_metric, history=history)
