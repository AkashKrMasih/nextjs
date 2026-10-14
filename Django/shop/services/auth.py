import bcrypt

from shop.models import User, VerifiedEmail
from shop.services.session import SessionPayload


def hash_password(plain: str) -> tuple[str, str]:
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8"), salt.decode("utf-8")


def verify_password(plain: str, user: User) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), user.password.encode("utf-8"))


def upsert_verified_email(user_id: str, email: str, verified: bool) -> None:
    VerifiedEmail.objects.update_or_create(
        user_id=user_id,
        email=email,
        defaults={"verified": verified},
    )


def create_user(
    email: str,
    plain_password: str,
    *,
    name: str | None = None,
    role: str = "CUSTOMER",
    email_verified: bool = True,
) -> User:
    password, password_salt = hash_password(plain_password)
    user = User.objects.create(
        email=email,
        name=name,
        role=role,
        email_verified=email_verified,
        password=password,
        password_salt=password_salt,
    )
    upsert_verified_email(user.id, user.email, email_verified)
    return user


def session_from_user(user: User) -> SessionPayload:
    return SessionPayload(
        user_id=user.id,
        email=user.email,
        name=user.name or "",
        role=user.role,
        email_verified=user.email_verified,
    )


def get_user_by_email(email: str) -> User | None:
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None
