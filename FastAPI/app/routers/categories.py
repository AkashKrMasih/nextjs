from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category
from app.schemas import CategoryOut
from app.services.categories import create_category, parse_category_fields

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post("", response_model=CategoryOut, status_code=201)
def create_category_route(
    name: str = Form(""),
    description: str = Form(""),
    slug: str = Form(""),
    parentId: str | None = Form(None),
    db: Session = Depends(get_db),
) -> Category:
    parsed = parse_category_fields(
        name=name,
        description=description,
        slug_input=slug,
        parent_id_raw=parentId,
    )
    if isinstance(parsed, str):
        raise HTTPException(status_code=400, detail={"error": parsed})

    result = create_category(db, parsed)
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail={"error": result})
    return result
