from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class FileMetric(Base, TimestampMixin):
    __tablename__ = "file_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id", ondelete="CASCADE"), index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)

    file_path: Mapped[str] = mapped_column(String(1024), index=True)
    language: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    churn: Mapped[int] = mapped_column(Integer, default=0)
    commit_frequency: Mapped[int] = mapped_column(Integer, default=0)
    bug_fix_frequency: Mapped[int] = mapped_column(Integer, default=0)
    file_age_days: Mapped[int] = mapped_column(Integer, default=0)
    loc: Mapped[int] = mapped_column(Integer, default=0)
    cyclomatic_complexity: Mapped[float] = mapped_column(Float, default=0)
    developer_count: Mapped[int] = mapped_column(Integer, default=0)
    coupling_score: Mapped[float] = mapped_column(Float, default=0)
    complexity_method: Mapped[str] = mapped_column(String(16), default="heuristic")  # ast|heuristic

    analysis_run: Mapped["AnalysisRun"] = relationship(back_populates="file_metrics")
    risk_prediction: Mapped[Optional["RiskPrediction"]] = relationship(
        back_populates="file_metric", uselist=False, cascade="all, delete-orphan"
    )
