from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class WebhookEvent(Base, TimestampMixin):
    __tablename__ = "webhook_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), nullable=True, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64), index=True)  # push|pull_request
    action: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
