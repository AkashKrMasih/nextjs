import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.http import HttpRequest, HttpResponse

SESSION_COOKIE_NAME = "session"
MAX_AGE_SECONDS = 60 * 60 * 24 * 7


@dataclass
class SessionPayload:
    user_id: str
    email: str
    name: str
    role: str
    email_verified: bool


def _secret() -> bytes:
    key = os.environ.get("JWT_SECRET") or getattr(settings, "JWT_SECRET", "")
    if not key:
        raise RuntimeError("JWT_SECRET is not set")
    return key.encode("utf-8")


def create_session_token(payload: SessionPayload) -> str:
    now = datetime.now(timezone.utc)
    body = {
        "userId": payload.user_id,
        "email": payload.email,
        "name": payload.name,
        "role": payload.role,
        "emailVerified": payload.email_verified,
        "iat": now,
        "exp": now + timedelta(seconds=MAX_AGE_SECONDS),
    }
    return jwt.encode(body, _secret(), algorithm="HS256")


def verify_session_token(token: str) -> SessionPayload | None:
    try:
        data = jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if not isinstance(data.get("userId"), str):
        return None
    return SessionPayload(
        user_id=data["userId"],
        email=str(data.get("email", "")),
        name=str(data.get("name", "")),
        role=str(data.get("role", "CUSTOMER")),
        email_verified=bool(data.get("emailVerified", True)),
    )


def get_session(request: HttpRequest) -> SessionPayload | None:
    token = request.COOKIES.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    return verify_session_token(token)


def set_session_cookie(response: HttpResponse, payload: SessionPayload) -> None:
    token = create_session_token(payload)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=MAX_AGE_SECONDS,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
    )


def clear_session_cookie(response: HttpResponse) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
