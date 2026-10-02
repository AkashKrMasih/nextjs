from sqlalchemy.orm import Session

from app.models import Category
from app.utils import slugify


def parse_category_fields(
    *,
    name: str,
    description: str,
    slug_input: str,
    parent_id_raw: str | None,
) -> dict | str:
    name = name.strip()
    description = description.strip()
    slug_input = slug_input.strip()

    if not name:
        return "Name is required."

    slug = slugify(slug_input or name)
    if not slug:
        return "Could not derive a valid slug from that name."

    parent_id: int | None = None
    if parent_id_raw and parent_id_raw.strip():
        try:
            parent_id = int(parent_id_raw)
        except ValueError:
            return "Invalid parent category."
        if parent_id <= 0:
            return "Invalid parent category."

    return {
        "name": name,
        "slug": slug,
        "description": description or None,
        "parent_id": parent_id,
    }


def create_category(db: Session, data: dict) -> Category | str:
    existing = db.query(Category).filter(Category.slug == data["slug"]).first()
    if existing:
        return f'Slug "{data["slug"]}" is already in use.'

    if data["parent_id"]:
        parent = db.get(Category, data["parent_id"])
        if not parent:
            return "Parent category not found."

    category = Category(
        name=data["name"],
        slug=data["slug"],
        description=data["description"],
        parent_id=data["parent_id"],
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
