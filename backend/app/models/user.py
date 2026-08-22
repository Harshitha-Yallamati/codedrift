from typing import List, Optional

from sqlalchemy import BigInteger, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    github_id: Mapped[Optional[int]] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    access_token_encrypted: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)

    repositories: Mapped[List["Repository"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
