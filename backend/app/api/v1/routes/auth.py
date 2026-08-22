from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, encrypt_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenResponse, UserRead
from app.services.github_service import GitHubAPIError, GitHubClient

router = APIRouter(tags=["auth"])


@router.get("/auth/github/login")
def github_login():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(400, "GitHub OAuth is not configured on this server yet")
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI,
        "scope": "read:user user:email repo",
    }
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{urlencode(params)}")


@router.get("/auth/github/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    try:
        with GitHubClient() as anon:
            access_token = anon.exchange_code_for_token(code)
        with GitHubClient(access_token) as gh:
            gh_user = gh.get_authenticated_user()
    except GitHubAPIError as exc:
        raise HTTPException(400, f"GitHub OAuth failed: {exc}") from exc

    github_id = gh_user["id"]
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        username = gh_user.get("login") or f"gh-{github_id}"
        base_username = username
        suffix = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}-{suffix}"
            suffix += 1
        user = User(github_id=github_id, username=username)
        db.add(user)

    user.email = gh_user.get("email")
    user.avatar_url = gh_user.get("avatar_url")
    user.access_token_encrypted = encrypt_token(access_token)
    db.commit()
    db.refresh(user)

    jwt_token = create_access_token(user.id)
    # Redirect to "/" (not "/auth/callback"): the static-site host has no SPA
    # rewrite rule configured, so a deep path 404s on cold load. App.tsx checks
    # for ?token= at the root and handles the callback regardless of path.
    return RedirectResponse(f"{settings.FRONTEND_URL}/?token={jwt_token}")


@router.post("/auth/demo", response_model=TokenResponse)
def login_demo(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == "demo", User.is_demo == True).first()  # noqa: E712
    if not user:
        user = User(username="demo", email="demo@codedrift.dev", is_demo=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    jwt_token = create_access_token(user.id)
    return TokenResponse(access_token=jwt_token, user=UserRead.model_validate(user))


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/auth/logout")
def logout():
    return {"ok": True}
