from datetime import datetime
from typing import List, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Repository(Base, TimestampMixin):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    github_repo_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(512), index=True)
    description: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    default_branch: Mapped[str] = mapped_column(String(255), default="main")
    private: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    webhook_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_category_counts: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    latest_run_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    owner: Mapped["User"] = relationship(back_populates="repositories")
    commits: Mapped[List["Commit"]] = relationship(back_populates="repository", cascade="all, delete-orphan")
    analysis_runs: Mapped[List["AnalysisRun"]] = relationship(back_populates="repository", cascade="all, delete-orphan")
    pull_requests: Mapped[List["PullRequest"]] = relationship(back_populates="repository", cascade="all, delete-orphan")
