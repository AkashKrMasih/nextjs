from django.shortcuts import redirect

from shop.services.session import get_session

PENDING_PATH = "/verify-email/pending/"


class EmailVerificationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if (
            path.startswith("/static/")
            or path.startswith("/api/")
            or path == "/favicon.ico"
            or "." in path.rsplit("/", 1)[-1]
        ):
            return self.get_response(request)

        session = get_session(request)
        if not session or session.email_verified:
            return self.get_response(request)

        allowed = {
            PENDING_PATH,
            "/verify-email/",
            f"/users/{session.user_id}/profile/",
        }
        if path in allowed:
            return self.get_response(request)
        return redirect(PENDING_PATH)
