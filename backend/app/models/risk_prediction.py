from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class RiskPrediction(Base, TimestampMixin):
    __tablename__ = "risk_predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    file_metric_id: Mapped[int] = mapped_column(
        ForeignKey("file_metrics.id", ondelete="CASCADE"), unique=True, index=True
    )

    defect_probability: Mapped[float] = mapped_column(Float)
    risk_category: Mapped[str] = mapped_column(String(16), index=True)  # low|medium|high|critical
    model_type: Mapped[str] = mapped_column(String(32))  # xgboost|heuristic
    model_version: Mapped[str] = mapped_column(String(64))
    explanation: Mapped[str] = mapped_column(String(2048))
    feature_contributions: Mapped[dict] = mapped_column(JSONB, default=dict)

    file_metric: Mapped["FileMetric"] = relationship(back_populates="risk_prediction")
