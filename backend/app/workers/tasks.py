import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.repository import Repository
from app.models.webhook_event import WebhookEvent
from app.services import analysis_service, pr_comment_service

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.tasks.analyze_repository_task")
def analyze_repository_task(repository_id: int, branch: str | None = None, trigger: str = "manual") -> int:
    db = SessionLocal()
    try:
        repository = db.get(Repository, repository_id)
        if not repository:
            logger.warning("analyze_repository_task: repository %s not found", repository_id)
            return -1
        run = analysis_service.run_analysis(db, repository, branch, trigger)
        return run.id
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.analyze_pull_request_task")
def analyze_pull_request_task(repository_id: int, pr_number: int) -> int:
    db = SessionLocal()
    try:
        repository = db.get(Repository, repository_id)
        if not repository:
            logger.warning("analyze_pull_request_task: repository %s not found", repository_id)
            return -1
        pr = pr_comment_service.analyze_pull_request(db, repository, pr_number)
        return pr.id
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.process_webhook_event_task")
def process_webhook_event_task(event_id: int) -> None:
    db = SessionLocal()
    try:
        event = db.get(WebhookEvent, event_id)
        if not event:
            return
        try:
            repository = db.get(Repository, event.repository_id) if event.repository_id else None
            if repository and event.event_type == "push":
                ref = event.payload.get("ref", "")
                branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else repository.default_branch
                analysis_service.run_analysis(db, repository, branch, trigger="webhook")
            elif repository and event.event_type == "pull_request" and event.action in (
                "opened",
                "synchronize",
                "reopened",
            ):
                pr_number = event.payload.get("pull_request", {}).get("number")
                if pr_number:
                    pr_comment_service.analyze_pull_request(db, repository, pr_number)
            event.processed = True
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to process webhook event %s", event_id)
            event.error_message = str(exc)[:2000]
        finally:
            event.processed_at = datetime.now(timezone.utc)
            db.add(event)
            db.commit()
    finally:
        db.close()
