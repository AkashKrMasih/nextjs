import os

from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from shop.models import Order, Product, Role, User, Wishlist, WishlistItem
from shop.services import auth as auth_service
from shop.services import cart as cart_service
from shop.services import catalog as catalog_service
from shop.services.session import clear_session_cookie, get_session, set_session_cookie
from shop.services.utils import validate_email


def _currency_symbol():
    return os.environ.get("CURRENCY_SYMBOL", "$")


@require_http_methods(["GET"])
def home(request):
    filters = catalog_service.parse_home_catalog_filters(request.GET.dict())
    products = catalog_service.home_catalog_queryset(filters)
    session = get_session(request)
    wishlisted: set[int] = set()
    if session:
        wishlisted = set(
            WishlistItem.objects.filter(wishlist__user_id=session.user_id).values_list(
                "product_id", flat=True
            )
        )
    return render(
        request,
        "shop/home.html",
        {
            "products": [catalog_service.serialize_home_catalog_product(p, wishlisted) for p in products],
            "filters": filters,
            "currency": _currency_symbol(),
            "session": session,
        },
    )


@require_http_methods(["GET"])
def product_page(request, product_id: int):
    product = get_object_or_404(
        Product.objects.prefetch_related("images", "variants__inventory", "reviews"),
        pk=product_id,
    )
    session = get_session(request)
    return render(
        request,
        "shop/product.html",
        {"product": product, "currency": _currency_symbol(), "session": session},
    )


@require_http_methods(["GET", "POST"])
def login_page(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        err = validate_email(email)
        if err:
            messages.error(request, err)
            return render(request, "shop/login.html")
        user = auth_service.get_user_by_email(email)
        if not user or not auth_service.verify_password(password, user):
            messages.error(request, "Invalid email or password")
            return render(request, "shop/login.html")
        if not user.email_verified:
            messages.error(request, "Verify your email before logging in.")
            return render(request, "shop/login.html")
        response = redirect("home")
        set_session_cookie(response, auth_service.session_from_user(user))
        cart_service.merge_guest_cart_on_login(request, user.id)
        return response
    return render(request, "shop/login.html", {"verified": request.GET.get("verified") == "1"})


@require_http_methods(["GET", "POST"])
def signup_page(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        if not email or not password:
            messages.error(request, "Email and password are required")
            return render(request, "shop/signup.html")
        if auth_service.get_user_by_email(email):
            messages.error(request, "Could not create account. Try a different email.")
            return render(request, "shop/signup.html")
        auth_service.create_user(email, password, email_verified=False)
        messages.success(request, f"Check {email} for a verification link before you log in.")
        return render(request, "shop/signup.html")
    return render(request, "shop/signup.html")


@require_http_methods(["POST", "GET"])
def logout_view(request):
    response = redirect("login")
    clear_session_cookie(response)
    return response


@require_http_methods(["GET"])
def wishlist_page(request):
    session = get_session(request)
    if not session:
        return redirect("login")
    wishlist, _ = Wishlist.objects.get_or_create(user_id=session.user_id)
    items = wishlist.items.select_related("product").all()
    return render(
        request,
        "shop/wishlist.html",
        {"items": items, "currency": _currency_symbol(), "session": session},
    )


@require_http_methods(["GET"])
def cart_page(request):
    items = cart_service.read_cart(request)
    total = sum(float(i["price"]) * i["quantity"] for i in items)
    return render(
        request,
        "shop/cart.html",
        {"items": items, "total": total, "currency": _currency_symbol(), "session": get_session(request)},
    )


@require_http_methods(["GET"])
def orders_page(request):
    session = get_session(request)
    if not session:
        return redirect("login")
    orders = Order.objects.filter(user_id=session.user_id).order_by("-created_at")
    return render(request, "shop/orders.html", {"orders": orders, "session": session})


@require_http_methods(["GET", "POST"])
def toggle_wishlist(request, product_id: int):
    session = get_session(request)
    if not session:
        return redirect("login")
    wishlist, _ = Wishlist.objects.get_or_create(user_id=session.user_id)
    existing = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).first()
    if existing:
        existing.delete()
    else:
        WishlistItem.objects.create(wishlist=wishlist, product_id=product_id)
    return redirect(request.META.get("HTTP_REFERER", reverse("home")))


@require_http_methods(["GET"])
def admin_dashboard(request):
    session = get_session(request)
    if not session or session.role != Role.ADMIN:
        return redirect("login")
    stats = {
        "products": Product.objects.count(),
        "users": User.objects.count(),
        "orders": Order.objects.count(),
    }
    return render(request, "shop/admin/dashboard.html", {"stats": stats, "session": session})


@require_http_methods(["GET"])
def admin_products(request):
    session = get_session(request)
    if not session or session.role != Role.ADMIN:
        return redirect("login")
    products = Product.objects.order_by("-created_at")
    return render(request, "shop/admin/products.html", {"products": products, "session": session})
