from decimal import Decimal

from django.utils import timezone

from shop.models import Discount, Product, ProductVariant
from shop.services.order_quantity import validate_order_quantity


def normalize_discount_code(code: str) -> str:
    return code.strip().upper()


def cents(value) -> int:
    return int(round(Decimal(str(value)) * 100))


def price_cart(items: list[dict], raw_code: str | None = None):
    if not items:
        return {"error": "Cart is empty"}
    for item in items:
        if not isinstance(item.get("id"), int) or item["id"] <= 0 or item.get("quantity", 0) < 1:
            return {"error": "Invalid cart item"}

    product_ids = list({item["id"] for item in items})
    products = list(
        Product.objects.filter(id__in=product_ids).prefetch_related(
            "variants"
        )
    )
    if len(products) != len(product_ids):
        return {"error": "One or more items no longer exist"}

    product_map = {p.id: p for p in products}
    for item in items:
        err = validate_order_quantity(product_map[item["id"]], item["quantity"])
        if err:
            return {"error": err}

    code = normalize_discount_code(raw_code) if raw_code and raw_code.strip() else None
    discount = None
    if code:
        discount = Discount.objects.filter(code=code).select_related("product").first()
        if not discount:
            return {"error": "Discount code not found."}
        if discount.expires_at <= timezone.now():
            return {"error": "This discount code has expired."}

    lines = []
    for item in items:
        product = product_map[item["id"]]
        variant = (
            product.variants.order_by("-is_default", "created_at").first()
        )
        if not variant:
            return {"error": "One or more items have no purchasable variant"}
        original = cents(variant.price if variant.price is not None else product.price)
        eligible = discount and (
            discount.product_id is None or discount.product_id == product.id
        )
        unit = original
        applied_code = None
        if eligible and discount.kind == "PERCENT":
            percent = float(discount.value)
            unit = max(0, round(original * (100 - percent) / 100))
        elif eligible and discount.kind == "AMOUNT":
            unit = max(0, original - cents(discount.value))
        if eligible and unit < original:
            applied_code = discount.code
        lines.append(
            {
                "productId": product.id,
                "variantId": variant.id,
                "name": product.name,
                "quantity": item["quantity"],
                "originalUnitPriceCents": original,
                "unitPriceCents": unit,
                "discountCode": applied_code,
            }
        )

    if discount and all(line["discountCode"] is None for line in lines):
        return {"error": "This code does not apply to the items in your cart."}

    subtotal = sum(line["originalUnitPriceCents"] * line["quantity"] for line in lines)
    total = sum(line["unitPriceCents"] * line["quantity"] for line in lines)
    applies_to = ""
    if discount:
        applies_to = discount.product.name if discount.product_id else "All products"

    return {
        "code": discount.code if discount else None,
        "kind": discount.kind if discount else None,
        "value": str(discount.value) if discount else None,
        "appliesTo": applies_to,
        "lines": lines,
        "subtotalCents": subtotal,
        "discountCents": subtotal - total,
        "amountTotalCents": total,
    }
