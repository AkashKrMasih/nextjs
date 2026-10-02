from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import CartAddBody, CartOut, CartPatchBody
from app.services import cart as cart_service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut)
def get_cart(request: Request, response: Response, db: Session = Depends(get_db)) -> CartOut:
    session_id = cart_service.resolve_session_id(request.cookies, response)
    items = cart_service.read_cart(db, session_id)
    return CartOut(items=items)


@router.post("", response_model=CartOut)
def add_cart_item(
    body: CartAddBody,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> CartOut:
    if not body.name or not body.price:
        raise HTTPException(status_code=400, detail={"error": "id, name, and price are required"})
    session_id = cart_service.resolve_session_id(request.cookies, response)
    try:
        items = cart_service.add_to_cart(
            db,
            session_id,
            product_id=body.id,
            name=body.name,
            price=body.price,
            quantity=body.quantity,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    return CartOut(items=items)


@router.patch("", response_model=CartOut)
def patch_cart_item(
    body: CartPatchBody,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> CartOut:
    session_id = cart_service.resolve_session_id(request.cookies, response)
    try:
        items = cart_service.update_quantity(db, session_id, body.id, body.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    return CartOut(items=items)


@router.delete("", response_model=CartOut)
def delete_cart(
    request: Request,
    response: Response,
    id: int | None = None,
    db: Session = Depends(get_db),
) -> CartOut:
    session_id = cart_service.resolve_session_id(request.cookies, response)
    if id is None:
        items = cart_service.clear_cart(db, session_id)
    else:
        items = cart_service.remove_from_cart(db, session_id, id)
    return CartOut(items=items)
