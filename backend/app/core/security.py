from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.core.config import settings

_fernet = Fernet(settings.FERNET_KEY.encode() if isinstance(settings.FERNET_KEY, str) else settings.FERNET_KEY)


def create_access_token(subject: int, extra_claims: Optional[dict[str, Any]] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def encrypt_token(raw: str) -> str:
    return _fernet.encrypt(raw.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()


def verify_github_signature(payload_body: bytes, signature_header: Optional[str], secret: Optional[str] = None) -> bool:
    import hashlib
    import hmac

    if not signature_header or not signature_header.startswith("sha256="):
        return False
    key = secret or settings.GITHUB_WEBHOOK_SECRET
    if not key:
        return False
    expected = hmac.new(key.encode(), payload_body, hashlib.sha256).hexdigest()
    got = signature_header.split("=", 1)[1]
    return hmac.compare_digest(expected, got)
