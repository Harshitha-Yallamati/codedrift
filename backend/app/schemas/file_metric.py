from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RiskPredictionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    defect_probability: float
    risk_category: str
    model_type: str
    model_version: str
    explanation: str
    feature_contributions: dict[str, float]


class FileRiskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_path: str
    language: Optional[str] = None
    churn: int
    commit_frequency: int
    bug_fix_frequency: int
    file_age_days: int
    loc: int
    cyclomatic_complexity: float
    developer_count: int
    coupling_score: float
    complexity_method: str
    risk_prediction: Optional[RiskPredictionRead] = None


class FileListResponse(BaseModel):
    repository_id: int
    run_id: int
    total: int
    files: list[FileRiskRead]


class FileHistoryPoint(BaseModel):
    run_id: int
    started_at: datetime
    defect_probability: Optional[float] = None
    risk_category: Optional[str] = None
    churn: int
    cyclomatic_complexity: float


class FileDetailResponse(BaseModel):
    file: FileRiskRead
    history: list[FileHistoryPoint]
