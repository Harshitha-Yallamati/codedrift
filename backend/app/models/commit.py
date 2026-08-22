from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Commit(Base, TimestampMixin):
    __tablename__ = "commits"
    __table_args__ = (UniqueConstraint("repository_id", "sha", name="uq_commit_repo_sha"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    sha: Mapped[str] = mapped_column(String(64), index=True)
    author_name: Mapped[str] = mapped_column(String(255))
    author_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(String(4096))
    is_bug_fix: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    additions: Mapped[int] = mapped_column(Integer, default=0)
    deletions: Mapped[int] = mapped_column(Integer, default=0)
    files_changed: Mapped[int] = mapped_column(Integer, default=0)
    branch: Mapped[str] = mapped_column(String(255), default="main")
    committed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    repository: Mapped["Repository"] = relationship(back_populates="commits")
