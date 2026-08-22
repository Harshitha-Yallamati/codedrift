from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "codedrift",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    # Free-tier deploy runs the worker in the same 512MB container as the API.
    # Celery's default prefork pool forks one child per CPU core, each loading
    # its own copy of xgboost/pandas/sklearn — solo + concurrency=1 keeps a
    # single process instead of multiplying that footprint and OOM-killing the container.
    worker_pool="solo",
    worker_concurrency=1,
)
