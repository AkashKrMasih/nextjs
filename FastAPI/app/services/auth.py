import bcrypt

from app.models import Role, User
from sqlalchemy.orm import Session


def hash_password(plain_password: str) -> tuple[str, str]:
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8"), salt.decode("utf-8")


def create_user(
    db: Session,
    *,
    email: str,
    plain_password: str,
    name: str | None,
    role: Role,
) -> User:
    password, password_salt = hash_password(plain_password)
    user = User(email=email, name=name, role=role, password=password, password_salt=password_salt)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
