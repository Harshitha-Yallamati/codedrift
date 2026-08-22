import json

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.security import verify_github_signature
from app.db.session import SessionLocal
from app.models.repository import Repository
from app.models.webhook_event import WebhookEvent

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/github")
async def github_webhook(request: Request):
    body = await request.body()
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON payload")

    full_name = (payload.get("repository") or {}).get("full_name")
    event_type = request.headers.get("X-GitHub-Event", "unknown")
    signature = request.headers.get("X-Hub-Signature-256")

    db: Session = SessionLocal()
    try:
        repository = db.query(Repository).filter(Repository.full_name == full_name).first() if full_name else None

        if repository:
            if not verify_github_signature(body, signature, repository.webhook_secret):
                raise HTTPException(401, "Invalid webhook signature")

        event = WebhookEvent(
            repository_id=repository.id if repository else None,
            event_type=event_type,
            action=payload.get("action"),
            payload=payload,
            processed=False,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        if repository:
            celery_app.send_task("app.workers.tasks.process_webhook_event_task", args=[event.id])

        return {"received": True}
    finally:
        db.close()
