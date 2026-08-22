from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.file_metric import FileRiskRead


class AnalysisRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repository_id: int
    branch: str
    status: str
    trigger: str
    commit_sha: Optional[str] = None
    model_type: Optional[str] = None
    model_version: Optional[str] = None
    health_score: Optional[float] = None
    files_analyzed: int
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    feature_importance: Optional[dict] = None
    training_samples: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None


class HealthSummary(BaseModel):
    repository_id: int
    health_score: float
    risk_category_counts: dict[str, int]
    total_files: int
    model_type: Optional[str] = None
    model_version: Optional[str] = None
    last_analyzed_at: Optional[datetime] = None
    top_risky_files: list[FileRiskRead]


class TrendPoint(BaseModel):
    run_id: int
    started_at: datetime
    health_score: Optional[float] = None
    avg_churn: float
    avg_complexity: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    files_analyzed: int


class TrendsResponse(BaseModel):
    repository_id: int
    points: list[TrendPoint]


class CorrelationEntry(BaseModel):
    metric: str
    correlation_with_risk: float


class AnalyticsResponse(BaseModel):
    repository_id: int
    run_id: int
    model_type: Optional[str] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    training_samples: Optional[int] = None
    feature_importance: dict[str, float]
    correlations: list[CorrelationEntry]
