from decimal import Decimal

from django.db import transaction
from django.http import HttpRequest

from shop.models import Cart, CartItem, CartStatus, Product, ProductVariant
from shop.services.order_quantity import validate_order_quantity
from shop.services.session import get_session


class CartItemDTO(dict):
    pass


def _default_variant(product: Product) -> ProductVariant | None:
    return (
        product.variants.order_by("-is_default", "created_at").first()
    )


def _to_dto(items) -> list[dict]:
    result = []
    for item in items:
        product_id = item.variant.product_id
        result.append(
            {
                "id": product_id,
                "name": item.name,
                "price": str(item.price),
                "quantity": item.quantity,
            }
        )
    return result


def _get_or_create_cart(request: HttpRequest) -> Cart:
    session = get_session(request)
    if session:
        cart = Cart.objects.filter(user_id=session.user_id, status=CartStatus.ACTIVE).first()
        if cart:
            return cart
        return Cart.objects.create(user_id=session.user_id, status=CartStatus.ACTIVE)

    session_id = request.COOKIES.get("guest_cart_session")
    if session_id:
        cart = Cart.objects.filter(session_id=session_id, status=CartStatus.ACTIVE).first()
        if cart:
            return cart
    cart = Cart.objects.create(session_id=session_id or "", status=CartStatus.ACTIVE)
    if not session_id:
        cart.session_id = cart.id
        cart.save(update_fields=["session_id"])
    return cart


def read_cart(request: HttpRequest) -> list[dict]:
    cart = _get_or_create_cart(request)
    items = cart.items.select_related("variant__product").all()
    return _to_dto(items)


def add_to_cart(
    request: HttpRequest, product_id: int, name: str, price: str, quantity: int = 1
) -> list[dict]:
    product = Product.objects.filter(pk=product_id).first()
    if not product:
        raise ValueError("Product not found")
    variant = _default_variant(product)
    if not variant:
        raise ValueError("Product has no variant")

    cart = _get_or_create_cart(request)
    existing = CartItem.objects.filter(cart=cart, variant=variant).first()
    next_qty = (existing.quantity if existing else 0) + quantity
    err = validate_order_quantity(product, next_qty)
    if err:
        raise ValueError(err)

    CartItem.objects.update_or_create(
        cart=cart,
        variant=variant,
        defaults={"name": name, "price": Decimal(price), "quantity": next_qty},
    )
    return read_cart(request)


def update_quantity(request: HttpRequest, product_id: int, quantity: int) -> list[dict]:
    cart = _get_or_create_cart(request)
    product = Product.objects.filter(pk=product_id).first()
    if not product:
        raise ValueError("Product not found")
    variant = _default_variant(product)
    if not variant:
        raise ValueError("Product has no variant")

    if quantity < 1:
        CartItem.objects.filter(cart=cart, variant=variant).delete()
    else:
        err = validate_order_quantity(product, quantity)
        if err:
            raise ValueError(err)
        CartItem.objects.filter(cart=cart, variant=variant).update(quantity=quantity)
    return read_cart(request)


def remove_from_cart(request: HttpRequest, product_id: int) -> list[dict]:
    cart = _get_or_create_cart(request)
    product = Product.objects.filter(pk=product_id).first()
    if product:
        variant = _default_variant(product)
        if variant:
            CartItem.objects.filter(cart=cart, variant=variant).delete()
    return read_cart(request)


def clear_cart(request: HttpRequest) -> list[dict]:
    cart = _get_or_create_cart(request)
    cart.items.all().delete()
    return []


@transaction.atomic
def merge_guest_cart_on_login(request: HttpRequest, user_id: str) -> list[dict]:
    guest_session = request.COOKIES.get("guest_cart_session")
    if not guest_session:
        return read_cart(request)

    guest_cart = Cart.objects.filter(session_id=guest_session, status=CartStatus.ACTIVE).first()
    if not guest_cart or not guest_cart.items.exists():
        return read_cart(request)

    user_cart = Cart.objects.filter(user_id=user_id, status=CartStatus.ACTIVE).first()
    if not user_cart:
        user_cart = Cart.objects.create(user_id=user_id, status=CartStatus.ACTIVE)

    for item in guest_cart.items.select_related("variant__product"):
        product = item.variant.product
        existing = CartItem.objects.filter(cart=user_cart, variant=item.variant).first()
        next_qty = (existing.quantity if existing else 0) + item.quantity
        err = validate_order_quantity(product, next_qty)
        if err:
            raise ValueError(err)
        CartItem.objects.update_or_create(
            cart=user_cart,
            variant=item.variant,
            defaults={
                "name": item.name,
                "price": item.price,
                "quantity": next_qty,
            },
        )

    guest_cart.status = CartStatus.ABANDONED
    guest_cart.save(update_fields=["status"])
    return read_cart(request)
