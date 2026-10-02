from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Product, ProductImage
from app.schemas import ProductCreate, ProductOut, ProductUpdate
from app.utils import slugify

router = APIRouter(prefix="/products", tags=["products"])


def _unique_friendly_id(db: Session, base: str) -> str:
    candidate = base
    suffix = 1
    while db.query(Product).filter(Product.friendly_id == candidate).first():
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    return (
        db.query(Product)
        .options(joinedload(Product.images))
        .order_by(Product.created_at.desc())
        .all()
    )


@router.post("", response_model=ProductOut, status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db)) -> Product:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail={"error": "Name is required."})

    price = body.price
    if price < 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid price."})

    base_slug = slugify(body.friendlyId or name)
    if not base_slug:
        raise HTTPException(status_code=400, detail={"error": "Could not derive friendly id."})
    if body.friendlyId:
        friendly_id = body.friendlyId.strip()
        if db.query(Product).filter(Product.friendly_id == friendly_id).first():
            raise HTTPException(status_code=400, detail={"error": "Friendly id already exists."})
    else:
        friendly_id = _unique_friendly_id(db, base_slug)

    if body.categoryId is not None:
        from app.models import Category

        if db.get(Category, body.categoryId) is None:
            raise HTTPException(status_code=400, detail={"error": "Category not found."})

    product = Product(
        name=name,
        friendly_id=friendly_id,
        description=body.description,
        price=Decimal(price),
        category_id=body.categoryId,
        min_order_quantity=body.minOrderQuantity,
        max_order_quantity=body.maxOrderQuantity,
    )
    db.add(product)
    db.flush()

    images = body.imageUrls or []
    for index, url in enumerate(images):
        db.add(
            ProductImage(
                product_id=product.id,
                url=url.strip(),
                is_primary=index == 0,
            )
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail={"error": "Could not create product."}) from None

    db.refresh(product)
    return db.query(Product).options(joinedload(Product.images)).filter(Product.id == product.id).one()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    if product_id <= 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid id"})
    product = (
        db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).first()
    )
    if not product:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, body: ProductUpdate, db: Session = Depends(get_db)) -> Product:
    if product_id <= 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid id"})

    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"error": "Not found"})

    if body.name is not None:
        product.name = body.name.strip()
    if body.description is not None:
        product.description = body.description
    if body.price is not None:
        product.price = Decimal(body.price)
    if body.friendlyId is not None:
        product.friendly_id = body.friendlyId.strip()
    if body.categoryId is not None:
        from app.models import Category

        if body.categoryId and db.get(Category, body.categoryId) is None:
            raise HTTPException(status_code=400, detail={"error": "Category not found."})
        product.category_id = body.categoryId
    if body.minOrderQuantity is not None:
        product.min_order_quantity = body.minOrderQuantity
    if body.maxOrderQuantity is not None:
        product.max_order_quantity = body.maxOrderQuantity

    db.commit()
    return db.query(Product).options(joinedload(Product.images)).filter(Product.id == product_id).one()


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    if product_id <= 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid id"})
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    db.delete(product)
    db.commit()
    return {"success": True}
