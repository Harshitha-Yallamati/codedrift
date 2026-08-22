from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class PullRequest(Base, TimestampMixin):
    __tablename__ = "pull_requests"
    __table_args__ = (UniqueConstraint("repository_id", "pr_number", name="uq_pr_repo_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    pr_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(1024))
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    state: Mapped[str] = mapped_column(String(16), default="open")  # open|closed|merged

    base_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    head_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_category: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    files_changed: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(String(4096), nullable=True)
    comment_preview: Mapped[Optional[str]] = mapped_column(String(8192), nullable=True)

    analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    repository: Mapped["Repository"] = relationship(back_populates="pull_requests")
