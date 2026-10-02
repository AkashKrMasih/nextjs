from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role, User
from app.schemas import UserOut
from app.services.auth import create_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user_route(
    name: str = Form(""),
    email: str = Form(""),
    password: str = Form(""),
    role: str = Form("CUSTOMER"),
    db: Session = Depends(get_db),
) -> User:
    name = name.strip()
    email = email.strip()
    role = role.strip()

    if not name:
        raise HTTPException(status_code=400, detail={"error": "Name is required."})
    if not email:
        raise HTTPException(status_code=400, detail={"error": "Email is required."})
    if not password:
        raise HTTPException(status_code=400, detail={"error": "Password is required."})
    if role not in ("CUSTOMER", "ADMIN"):
        raise HTTPException(status_code=400, detail={"error": "Role must be customer or admin."})

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail={"error": "That email is already in use."})

    user = create_user(
        db,
        email=email,
        plain_password=password,
        name=name,
        role=Role(role),
    )
    return user
