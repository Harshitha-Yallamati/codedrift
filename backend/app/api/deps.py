from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.repository import Repository
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def get_owned_repository(
    repo_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Repository:
    repository = db.get(Repository, repo_id)
    if not repository:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Repository not found")
    if repository.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this repository")
    return repository
