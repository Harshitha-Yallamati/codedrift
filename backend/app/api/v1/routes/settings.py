from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["settings"])


@router.get("/settings/github-status")
def github_status(current_user: User = Depends(get_current_user)):
    return {"connected": bool(current_user.access_token_encrypted)}
