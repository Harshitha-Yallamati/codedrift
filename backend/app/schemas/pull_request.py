from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PRFileRisk(BaseModel):
    file_path: str
    additions: int
    deletions: int
    defect_probability: Optional[float] = None
    risk_category: Optional[str] = None
    is_new_file: bool = False


class PullRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repository_id: int
    pr_number: int
    title: str
    author: Optional[str] = None
    state: str
    base_branch: Optional[str] = None
    head_branch: Optional[str] = None
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    files_changed: Optional[list[PRFileRisk]] = None
    summary: Optional[str] = None
    analyzed_at: Optional[datetime] = None
    created_at: datetime


class PRCommentPreview(BaseModel):
    pr_id: int
    markdown: str
