from datetime import datetime, timedelta, timezone

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(
    user_id: int,
    expires_minutes: int | None = None,
) -> str:
    if expires_minutes is None:
        expires_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

    if expires_minutes <= 0:
        raise ValueError("JWT expiration must be greater than zero.")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    if not token or not isinstance(token, str):
        raise InvalidTokenError("Invalid authentication token.")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "require": ["sub", "exp"],
            },
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str) or not user_id.strip():
            raise InvalidTokenError("Invalid authentication token.")

        return payload

    except ExpiredSignatureError:
        raise
    except InvalidTokenError:
        raise
    except Exception as exc:
        raise InvalidTokenError("Invalid authentication token.") from exc
