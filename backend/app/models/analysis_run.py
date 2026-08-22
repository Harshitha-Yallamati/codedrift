from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, utcnow


class AnalysisRun(Base, TimestampMixin):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    branch: Mapped[str] = mapped_column(String(255), default="main")
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)  # pending|running|completed|failed
    trigger: Mapped[str] = mapped_column(String(32), default="manual")  # manual|webhook|scheduled
    commit_sha: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    model_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # xgboost|heuristic
    model_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    files_analyzed: Mapped[int] = mapped_column(Integer, default=0)

    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    roc_auc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feature_importance: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    training_samples: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)

    repository: Mapped["Repository"] = relationship(back_populates="analysis_runs")
    file_metrics: Mapped[List["FileMetric"]] = relationship(back_populates="analysis_run", cascade="all, delete-orphan")
