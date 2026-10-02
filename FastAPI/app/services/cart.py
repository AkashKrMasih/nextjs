import uuid
from decimal import Decimal

from fastapi import Response
from sqlalchemy.orm import Session, joinedload

from app.models import Cart, CartItem, CartStatus, Product
from app.schemas import CartItemOut

GUEST_COOKIE = "guest_cart_id"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30


def cart_item_dtos(items: list[CartItem]) -> list[CartItemOut]:
    return [
        CartItemOut(
            id=item.product_id,
            name=item.name,
            price=format(item.price, "f"),
            quantity=item.quantity,
        )
        for item in items
    ]


def get_guest_session_id(request_cookies: dict[str, str]) -> str | None:
    return request_cookies.get(GUEST_COOKIE)


def ensure_guest_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=GUEST_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def get_or_create_cart(db: Session, session_id: str) -> Cart:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items))
        .filter(Cart.session_id == session_id, Cart.status == CartStatus.ACTIVE)
        .first()
    )
    if cart:
        return cart

    cart = Cart(session_id=session_id, status=CartStatus.ACTIVE)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return db.query(Cart).options(joinedload(Cart.items)).filter(Cart.id == cart.id).one()


def validate_order_quantity(product: Product, quantity: int) -> str | None:
    if product.min_order_quantity is not None and quantity < product.min_order_quantity:
        return f"Minimum order quantity for {product.name} is {product.min_order_quantity}."
    if product.max_order_quantity is not None and quantity > product.max_order_quantity:
        return f"Maximum order quantity for {product.name} is {product.max_order_quantity}."
    return None


def read_cart(db: Session, session_id: str) -> list[CartItemOut]:
    cart = get_or_create_cart(db, session_id)
    return cart_item_dtos(cart.items)


def add_to_cart(
    db: Session,
    session_id: str,
    *,
    product_id: int,
    name: str,
    price: str,
    quantity: int,
) -> list[CartItemOut]:
    cart = get_or_create_cart(db, session_id)
    product = db.get(Product, product_id)
    if not product:
        raise ValueError("Product not found")

    existing = next((i for i in cart.items if i.product_id == product_id), None)
    next_quantity = (existing.quantity if existing else 0) + quantity
    error = validate_order_quantity(product, next_quantity)
    if error:
        raise ValueError(error)

    if existing:
        existing.quantity += quantity
    else:
        cart.items.append(
            CartItem(
                cart_id=cart.id,
                product_id=product_id,
                name=name,
                price=Decimal(price),
                quantity=quantity,
            )
        )
    db.commit()
    db.refresh(cart)
    return read_cart(db, session_id)


def update_quantity(db: Session, session_id: str, product_id: int, quantity: int) -> list[CartItemOut]:
    cart = get_or_create_cart(db, session_id)
    item = next((i for i in cart.items if i.product_id == product_id), None)

    if quantity < 1:
        if item:
            db.delete(item)
            db.commit()
        return read_cart(db, session_id)

    product = db.get(Product, product_id)
    if not product:
        raise ValueError("Product not found")
    error = validate_order_quantity(product, quantity)
    if error:
        raise ValueError(error)

    if not item:
        raise ValueError("Item not in cart")
    item.quantity = quantity
    db.commit()
    return read_cart(db, session_id)


def remove_from_cart(db: Session, session_id: str, product_id: int) -> list[CartItemOut]:
    cart = get_or_create_cart(db, session_id)
    item = next((i for i in cart.items if i.product_id == product_id), None)
    if item:
        db.delete(item)
        db.commit()
    return read_cart(db, session_id)


def clear_cart(db: Session, session_id: str) -> list[CartItemOut]:
    cart = get_or_create_cart(db, session_id)
    for item in list(cart.items):
        db.delete(item)
    db.commit()
    return []


def resolve_session_id(cookies: dict[str, str], response: Response) -> str:
    existing = get_guest_session_id(cookies)
    if existing:
        return existing
    session_id = str(uuid.uuid4())
    ensure_guest_cookie(response, session_id)
    return session_id
