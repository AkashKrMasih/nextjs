from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from shop.api import views

def _api(view):
    return csrf_exempt(view)


urlpatterns = [
    path("cart/", _api(views.cart_api), name="api-cart"),
    path("cart/merge/", _api(views.cart_merge), name="api-cart-merge"),
    path("home-catalog/", _api(views.home_catalog), name="api-home-catalog"),
    path("products/", _api(views.products_list), name="api-products"),
    path("products/<int:product_id>/", _api(views.product_detail), name="api-product-detail"),
    path("categories/", _api(views.categories_api), name="api-categories"),
    path("auth/session/", _api(views.auth_session), name="api-auth-session"),
    path("signup/", _api(views.signup_api), name="api-signup"),
    path("discounts/", _api(views.discounts_api), name="api-discounts"),
    path("discounts/preview/", _api(views.discounts_preview), name="api-discounts-preview"),
    path("discounts/offers/", _api(views.discounts_offers), name="api-discounts-offers"),
    path("home-page-promotions/", _api(views.home_page_promotions), name="api-promotions"),
    path("product-reports/", _api(views.product_reports), name="api-product-reports"),
    path("checkout/create-payment-intent/", _api(views.create_payment_intent), name="api-payment-intent"),
    path("checkout/webhook/", views.stripe_webhook, name="api-stripe-webhook"),
    path("users/", _api(views.users_list), name="api-users"),
]
