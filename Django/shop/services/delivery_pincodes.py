from shop.models import Product

INVALID_PINCODE_MESSAGE = "Not valid pincode for this product"


def normalize_pincode(raw: str) -> str:
    return raw.strip().replace(" ", "").upper()


def get_allowed_pincodes_for_product(product_id: int) -> list[str] | None:
    product = (
        Product.objects.filter(pk=product_id)
        .select_related("pincode_template")
        .prefetch_related("pincode_template__entries", "delivery_pincodes")
        .first()
    )
    if not product:
        return None
    if product.pincode_template_id and product.pincode_template:
        codes = [e.code for e in product.pincode_template.entries.all()]
        return codes if codes else None
    custom = [e.code for e in product.delivery_pincodes.all()]
    return custom if custom else None


def pincode_is_allowed(allowed: list[str] | None, postal_code: str) -> bool:
    if not allowed:
        return True
    normalized = normalize_pincode(postal_code)
    if not normalized:
        return False
    return normalized in {normalize_pincode(c) for c in allowed}


def validate_cart_delivery_pincode(product_ids: list[int], postal_code: str):
    normalized = normalize_pincode(postal_code)
    if not normalized:
        return {"ok": False, "productName": ""}
    for pid in set(product_ids):
        product = Product.objects.filter(pk=pid).only("id", "name").first()
        if not product:
            continue
        allowed = get_allowed_pincodes_for_product(product.id)
        if not pincode_is_allowed(allowed, postal_code):
            return {"ok": False, "productName": product.name}
    return {"ok": True}
