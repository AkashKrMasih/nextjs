import secrets

from django.http import HttpRequest, HttpResponse

GUEST_CART_COOKIE = "guest_cart_session"


def get_guest_session_id(request: HttpRequest) -> str | None:
    return request.COOKIES.get(GUEST_CART_COOKIE)


def ensure_guest_session_id(response: HttpResponse) -> str:
    session_id = secrets.token_urlsafe(32)
    response.set_cookie(
        GUEST_CART_COOKIE,
        session_id,
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/",
    )
    return session_id
