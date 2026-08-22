from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RepositoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    description: Optional[str] = None
    default_branch: str
    private: bool
    language: Optional[str] = None
    stars: int
    is_demo: bool
    created_at: datetime
    last_analyzed_at: Optional[datetime] = None
    health_score: Optional[float] = None
    risk_category_counts: Optional[dict] = None
    latest_run_id: Optional[int] = None


class RepositoryConnect(BaseModel):
    github_repo_id: Optional[int] = None
    full_name: str
    description: Optional[str] = None
    default_branch: str = "main"
    private: bool = False
    language: Optional[str] = None
    stars: int = 0


class GitHubRepoOption(BaseModel):
    github_repo_id: int
    full_name: str
    description: Optional[str] = None
    default_branch: str = "main"
    private: bool = False
    language: Optional[str] = None
    stars: int = 0
    already_connected: bool = False


class AnalyzeRequest(BaseModel):
    branch: Optional[str] = None
    trigger: str = "manual"


class WebhookInfo(BaseModel):
    webhook_url: str
    secret: str
    events: list[str] = ["push", "pull_request"]
