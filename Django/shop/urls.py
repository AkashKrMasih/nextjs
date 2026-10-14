from django.urls import include, path

from shop import views

urlpatterns = [
    path("", views.home, name="home"),
    path("login/", views.login_page, name="login"),
    path("signup/", views.signup_page, name="signup"),
    path("logout/", views.logout_view, name="logout"),
    path("products/<int:product_id>/", views.product_page, name="product"),
    path("cart/", views.cart_page, name="cart"),
    path("wishlist/", views.wishlist_page, name="wishlist"),
    path("wishlist/toggle/<int:product_id>/", views.toggle_wishlist, name="wishlist-toggle"),
    path("orders/", views.orders_page, name="orders"),
    path("admin/", views.admin_dashboard, name="admin"),
    path("admin/products/", views.admin_products, name="admin-products"),
    path("api/", include("shop.api.urls")),
]
