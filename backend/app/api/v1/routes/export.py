from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_owned_repository
from app.db.session import get_db
from app.models.repository import Repository
from app.services import export_service, metrics_service

router = APIRouter(tags=["export"])


def _latest_files(db: Session, repository: Repository):
    run = metrics_service.latest_completed_run(db, repository.id)
    if not run:
        raise HTTPException(404, "No completed analysis run found for this repository")
    files = metrics_service.get_file_list(db, repository, run, sort="risk_desc")
    return run, files


@router.get("/repos/{repo_id}/export/csv")
def export_csv(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    _run, files = _latest_files(db, repository)
    buffer = export_service.export_csv(repository, files)
    filename = f"{repository.full_name.replace('/', '-')}-codedrift.csv"
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/repos/{repo_id}/export/pdf")
def export_pdf(repository: Repository = Depends(get_owned_repository), db: Session = Depends(get_db)):
    run, files = _latest_files(db, repository)
    buffer = export_service.export_pdf(repository, files, run.health_score or 0.0)
    filename = f"{repository.full_name.replace('/', '-')}-codedrift.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
