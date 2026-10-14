import json
import os

import stripe
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from shop.models import (
    Category,
    Discount,
    HomePagePromotion,
    Order,
    OrderStatus,
    Product,
    ProductReport,
    User,
)
from shop.services import auth as auth_service
from shop.services import cart as cart_service
from shop.services import catalog as catalog_service
from shop.services import discounts as discount_service
from shop.services import delivery_pincodes
from shop.services.session import get_session


def _json_error(message: str, status: int = 400):
    return JsonResponse({"error": message}, status=status)


def _require_admin(request):
    session = get_session(request)
    if not session or session.role != "ADMIN":
        return None
    return session


@require_http_methods(["GET", "POST", "PATCH", "DELETE"])
def cart_api(request):
    if request.method == "GET":
        return JsonResponse({"items": cart_service.read_cart(request)})
    if request.method == "DELETE":
        id_param = request.GET.get("id")
        if id_param is None:
            return JsonResponse({"items": cart_service.clear_cart(request)})
        return JsonResponse({"items": cart_service.remove_from_cart(request, int(id_param))})
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON")
    if request.method == "POST":
        pid, name, price, qty = body.get("id"), body.get("name"), body.get("price"), body.get("quantity", 1)
        if not isinstance(pid, int) or not name or not price:
            return _json_error("id, name, and price are required")
        try:
            items = cart_service.add_to_cart(request, pid, name, str(price), int(qty))
        except ValueError as e:
            return _json_error(str(e))
        return JsonResponse({"items": items})
    if request.method == "PATCH":
        pid, qty = body.get("id"), body.get("quantity")
        if not isinstance(pid, int) or not isinstance(qty, int):
            return _json_error("id and quantity are required")
        try:
            items = cart_service.update_quantity(request, pid, qty)
        except ValueError as e:
            return _json_error(str(e))
        return JsonResponse({"items": items})
    return _json_error("Method not allowed", 405)


@require_http_methods(["POST"])
def cart_merge(request):
    session = get_session(request)
    if not session:
        return _json_error("Unauthorized", 401)
    try:
        items = cart_service.merge_guest_cart_on_login(request, session.user_id)
    except ValueError as e:
        return _json_error(str(e))
    return JsonResponse({"items": items})


@require_http_methods(["GET"])
def home_catalog(request):
    params = {
        "q": request.GET.get("q"),
        "category": request.GET.get("category"),
        "min": request.GET.get("min"),
        "max": request.GET.get("max"),
        "sort": request.GET.get("sort"),
    }
    filters = catalog_service.parse_home_catalog_filters(params)
    products = catalog_service.home_catalog_queryset(filters)
    session = get_session(request)
    wishlisted: set[int] = set()
    if session:
        from shop.models import WishlistItem

        wishlisted = set(
            WishlistItem.objects.filter(wishlist__user_id=session.user_id).values_list(
                "product_id", flat=True
            )
        )
    return JsonResponse(
        {
            "hasFilters": filters["has_filters"],
            "products": [
                catalog_service.serialize_home_catalog_product(p, wishlisted) for p in products
            ],
        }
    )


@require_http_methods(["GET", "POST"])
def products_list(request):
    if request.method == "GET":
        rows = Product.objects.prefetch_related("images").order_by("-created_at")
        data = []
        for p in rows:
            data.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "friendlyId": p.friendly_id,
                    "description": p.description,
                    "price": str(p.price),
                    "images": [{"id": i.id, "url": i.url, "isPrimary": i.is_primary} for i in p.images.all()],
                }
            )
        return JsonResponse(data, safe=False)
    return _json_error("Use admin UI for product creation", 501)


@require_http_methods(["GET", "PUT", "DELETE"])
def product_detail(request, product_id: int):
    product = Product.objects.filter(pk=product_id).prefetch_related("images", "variants").first()
    if not product:
        return _json_error("Not found", 404)
    if request.method == "GET":
        return JsonResponse(
            {
                "id": product.id,
                "name": product.name,
                "friendlyId": product.friendly_id,
                "description": product.description,
                "price": str(product.price),
                "images": [{"url": i.url, "isPrimary": i.is_primary} for i in product.images.all()],
            }
        )
    if not _require_admin(request):
        return _json_error("Forbidden", 403)
    if request.method == "DELETE":
        product.delete()
        return JsonResponse({"ok": True})
    return _json_error("Use admin UI", 501)


@require_http_methods(["GET", "POST"])
def categories_api(request):
    if request.method == "GET":
        rows = Category.objects.order_by("name")
        return JsonResponse(
            [
                {
                    "id": c.id,
                    "name": c.name,
                    "slug": c.slug,
                    "description": c.description,
                    "parentId": c.parent_id,
                }
                for c in rows
            ],
            safe=False,
        )
    if not _require_admin(request):
        return _json_error("Forbidden", 403)
    return _json_error("Use admin UI", 501)


@require_http_methods(["GET"])
def auth_session(request):
    session = get_session(request)
    if not session:
        return JsonResponse({"user": None})
    return JsonResponse(
        {
            "user": {
                "id": session.user_id,
                "email": session.email,
                "name": session.name,
                "role": session.role,
                "emailVerified": session.email_verified,
            }
        }
    )


@require_http_methods(["POST"])
def signup_api(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON")
    email, password = body.get("email"), body.get("password")
    if not email or not password:
        return _json_error("email and password required")
    if auth_service.get_user_by_email(email):
        return _json_error("User exists", 400)
    user = auth_service.create_user(email, password)
    return JsonResponse({"id": user.id, "email": user.email}, status=201)


@require_http_methods(["GET", "POST"])
def discounts_api(request):
    if request.method == "GET":
        rows = Discount.objects.select_related("product").order_by("-created_at")
        return JsonResponse(
            [
                {
                    "id": d.id,
                    "code": d.code,
                    "kind": d.kind,
                    "value": str(d.value),
                    "productId": d.product_id,
                    "expiresAt": d.expires_at.isoformat(),
                }
                for d in rows
            ],
            safe=False,
        )
    if not _require_admin(request):
        return _json_error("Forbidden", 403)
    return _json_error("Use admin UI", 501)


@require_http_methods(["POST"])
def discounts_preview(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON")
    priced = discount_service.price_cart(body.get("items") or [], body.get("code"))
    if "error" in priced:
        return _json_error(priced["error"])
    return JsonResponse(priced)


@require_http_methods(["GET"])
def discounts_offers(request):
    from django.db import models
    from django.utils import timezone

    product_id = request.GET.get("productId")
    if not product_id:
        return _json_error("productId required")
    try:
        pid = int(product_id)
    except ValueError:
        return _json_error("Invalid productId")

    rows = Discount.objects.filter(expires_at__gt=timezone.now()).filter(
        models.Q(product_id__isnull=True) | models.Q(product_id=pid)
    )
    return JsonResponse(
        [
            {
                "code": r.code,
                "kind": r.kind,
                "value": str(r.value),
                "scope": "all" if r.product_id is None else "product",
            }
            for r in rows
        ],
        safe=False,
    )


@require_http_methods(["GET", "POST"])
def home_page_promotions(request):
    if request.method == "GET":
        promos = HomePagePromotion.objects.select_related("product").order_by("sort_order")
        return JsonResponse(
            [
                {
                    "id": p.id,
                    "imageUrl": p.image_url,
                    "linkUrl": p.link_url,
                    "productId": p.product_id,
                    "sortOrder": p.sort_order,
                }
                for p in promos
            ],
            safe=False,
        )
    if not _require_admin(request):
        return _json_error("Forbidden", 403)
    return _json_error("Use admin UI", 501)


@require_http_methods(["POST"])
def product_reports(request):
    session = get_session(request)
    if not session:
        return _json_error("Unauthorized", 401)
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON")
    ProductReport.objects.create(
        reason=body.get("reason", ""),
        message=body.get("message", ""),
        product_id=body.get("productId"),
        user_id=session.user_id,
    )
    return JsonResponse({"ok": True}, status=201)


@require_http_methods(["POST"])
def create_payment_intent(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return _json_error("Invalid JSON")
    items = body.get("items") or []
    guest_email = body.get("guestEmail")
    discount_code = body.get("discountCode")
    postal_code = body.get("postalCode")
    if not items:
        return _json_error("Cart is empty")
    if not delivery_pincodes.normalize_pincode(str(postal_code or "")):
        return _json_error("Delivery postal code is required.")
    session = get_session(request)
    if not session and not guest_email:
        return _json_error("guestEmail is required for guest checkout")
    priced = discount_service.price_cart(
        [{"id": int(i["id"]), "quantity": int(i["quantity"])} for i in items],
        discount_code,
    )
    if "error" in priced:
        return _json_error(priced["error"])
    pincode_check = delivery_pincodes.validate_cart_delivery_pincode(
        [line["productId"] for line in priced["lines"]], str(postal_code)
    )
    if not pincode_check.get("ok"):
        msg = delivery_pincodes.INVALID_PINCODE_MESSAGE
        if pincode_check.get("productName"):
            msg = f"{msg} ({pincode_check['productName']})"
        return _json_error(msg)
    if priced["amountTotalCents"] <= 0:
        return _json_error("Invalid order total")
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        return _json_error("Stripe not configured", 500)
    line_items = [
        {
            "variantId": line["variantId"],
            "name": line["name"],
            "unitPrice": line["unitPriceCents"],
            "quantity": line["quantity"],
            "discountCode": line["discountCode"],
        }
        for line in priced["lines"]
    ]
    intent = stripe.PaymentIntent.create(
        amount=priced["amountTotalCents"],
        currency=os.environ.get("CURRENCY_CODE", "usd").lower(),
        receipt_email=(session.email if session else guest_email),
        metadata={
            "userId": session.user_id if session else "",
            "guestEmail": "" if session else (guest_email or ""),
            "discountCode": priced.get("code") or "",
            "items": json.dumps(line_items),
        },
        automatic_payment_methods={"enabled": True},
    )
    return JsonResponse({"clientSecret": intent.client_secret})


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    sig = request.headers.get("Stripe-Signature")
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not sig or not secret:
        return _json_error("Webhook not configured", 400)
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    try:
        event = stripe.Webhook.construct_event(request.body, sig, secret)
    except Exception as e:
        return _json_error(f"Signature verification failed: {e}", 400)
    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        if Order.objects.filter(stripe_payment_intent_id=pi["id"]).exists():
            return JsonResponse({"received": True})
        user_id = pi["metadata"].get("userId") or None
        guest_email = pi["metadata"].get("guestEmail") or None
        items = json.loads(pi["metadata"].get("items") or "[]")
        from shop.models import OrderItem

        order = Order.objects.create(
            user_id=user_id or None,
            guest_email=guest_email or None,
            status=OrderStatus.PAID,
            amount_total=pi["amount"],
            currency=pi["currency"],
            stripe_payment_intent_id=pi["id"],
        )
        for item in items:
            OrderItem.objects.create(
                order=order,
                variant_id=item["variantId"],
                name=item["name"],
                unit_price=item["unitPrice"],
                quantity=item["quantity"],
                discount_code=item.get("discountCode"),
            )
    return JsonResponse({"received": True})


@require_http_methods(["GET"])
def users_list(request):
    if not _require_admin(request):
        return _json_error("Forbidden", 403)
    users = User.objects.order_by("-created_at")
    return JsonResponse(
        [{"id": u.id, "email": u.email, "name": u.name, "role": u.role} for u in users],
        safe=False,
    )
