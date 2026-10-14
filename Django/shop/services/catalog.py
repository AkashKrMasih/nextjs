from django.db.models import Q

from shop.models import Product


def parse_home_catalog_filters(params: dict) -> dict:
    query = (params.get("q") or "").strip()
    category_raw = params.get("category")
    category_id = None
    if category_raw:
        try:
            category_id = int(category_raw)
            if category_id <= 0:
                category_id = None
        except (TypeError, ValueError):
            category_id = None

    def number_param(value):
        if value is None or str(value).strip() == "":
            return None
        try:
            n = float(value)
            return n if n >= 0 else None
        except (TypeError, ValueError):
            return None

    min_price = number_param(params.get("min"))
    max_price = number_param(params.get("max"))
    sort = params.get("sort") or "newest"
    if sort not in ("newest", "price", "title"):
        sort = "newest"
    has_filters = bool(query or category_id or min_price is not None or max_price is not None)
    return {
        "query": query,
        "category_id": category_id,
        "min_price": min_price,
        "max_price": max_price,
        "sort": sort,
        "has_filters": has_filters,
    }


def home_catalog_queryset(filters: dict):
    qs = Product.objects.prefetch_related("images", "variants__inventory")
    if filters["category_id"]:
        qs = qs.filter(category_id=filters["category_id"])
    if filters["min_price"] is not None:
        qs = qs.filter(price__gte=filters["min_price"])
    if filters["max_price"] is not None:
        qs = qs.filter(price__lte=filters["max_price"])
    if filters["query"]:
        q = filters["query"]
        qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
    if filters["sort"] == "price":
        qs = qs.order_by("price")
    elif filters["sort"] == "title":
        qs = qs.order_by("name")
    else:
        qs = qs.order_by("-created_at")
    return qs


def product_stock(product: Product) -> int:
    total = 0
    for variant in product.variants.all():
        inv = getattr(variant, "inventory", None)
        if inv:
            total += inv.quantity
    return total


def serialize_home_catalog_product(product: Product, wishlisted_ids: set[int]) -> dict:
    image = product.images.order_by("-is_primary").first()
    return {
        "id": product.id,
        "friendlyId": product.friendly_id,
        "name": product.name,
        "price": str(product.price),
        "imageUrl": image.url if image else None,
        "stock": product_stock(product),
        "wishlisted": product.id in wishlisted_ids,
    }
