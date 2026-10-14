import uuid

from django.db import models
from django.utils import timezone


def new_cuid() -> str:
    try:
        from cuid2 import cuid_wrapper

        return cuid_wrapper()()
    except ImportError:
        return uuid.uuid4().hex


class Role(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    ADMIN = "ADMIN", "Admin"


class ReviewStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class CartStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    CONVERTED = "CONVERTED", "Converted"
    ABANDONED = "ABANDONED", "Abandoned"


class OrderStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    FAILED = "FAILED", "Failed"


class SupportTicketCategory(models.TextChoices):
    DELIVERY = "DELIVERY", "Delivery"
    ITEM_ISSUE = "ITEM_ISSUE", "Item issue"
    REFUND = "REFUND", "Refund"
    ORDER_STATUS = "ORDER_STATUS", "Order status"
    OTHER = "OTHER", "Other"


class SupportTicketStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class DiscountKind(models.TextChoices):
    PERCENT = "PERCENT", "Percent"
    AMOUNT = "AMOUNT", "Amount"


class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Category"
        indexes = [models.Index(fields=["parent"])]


class PincodeTemplate(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "PincodeTemplate"


class PincodeTemplateEntry(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    template = models.ForeignKey(
        PincodeTemplate, on_delete=models.CASCADE, related_name="entries"
    )
    code = models.CharField(max_length=32)

    class Meta:
        db_table = "PincodeTemplateEntry"
        unique_together = [("template", "code")]
        indexes = [
            models.Index(fields=["template"]),
            models.Index(fields=["code"]),
        ]


class Product(models.Model):
    name = models.CharField(max_length=255)
    friendly_id = models.CharField(max_length=255, unique=True, db_column="friendly_id")
    description = models.TextField(default="", blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_quantity = models.IntegerField(null=True, blank=True)
    max_order_quantity = models.IntegerField(null=True, blank=True)
    return_in_days = models.IntegerField(null=True, blank=True)
    reviews_enabled = models.BooleanField(default=True, db_column="reviews_enabled")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    avg_rating = models.FloatField(default=0)
    review_count = models.IntegerField(default=0)
    pincode_template = models.ForeignKey(
        PincodeTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        db_column="pincodeTemplateId",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Product"
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["pincode_template"]),
        ]


class ProductDeliveryPincode(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="delivery_pincodes")
    code = models.CharField(max_length=32)

    class Meta:
        db_table = "ProductDeliveryPincode"
        unique_together = [("product", "code")]


class HomePagePromotion(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    image_url = models.CharField(max_length=2048, db_column="imageUrl")
    link_url = models.CharField(max_length=2048, blank=True, null=True, db_column="linkUrl")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions"
    )
    sort_order = models.IntegerField(default=0, db_column="sortOrder")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "HomePagePromotion"
        ordering = ["sort_order"]


class ProductVariant(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    attributes = models.JSONField(null=True, blank=True)
    is_default = models.BooleanField(default=False, db_column="isDefault")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ProductVariant"
        indexes = [models.Index(fields=["product"])]


class Inventory(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    variant = models.OneToOneField(
        ProductVariant, on_delete=models.CASCADE, related_name="inventory"
    )
    quantity = models.IntegerField(default=0)
    reserved = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Inventory"


class ProductImage(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    url = models.CharField(max_length=2048)
    is_primary = models.BooleanField(default=False, db_column="isPrimary")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")

    class Meta:
        db_table = "ProductImage"
        indexes = [models.Index(fields=["product"])]


class ProductAttribute(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    title = models.CharField(max_length=255)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attributes")
    value = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ProductAttribute"
        indexes = [models.Index(fields=["product"]), models.Index(fields=["title"])]


class User(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    password = models.CharField(max_length=255)
    password_salt = models.CharField(max_length=255, db_column="password_salt")
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CUSTOMER)
    email_verified = models.BooleanField(default=True, db_column="emailVerified")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "User"


class VerifiedEmail(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verified_emails")
    email = models.EmailField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "VerifiedEmail"
        unique_together = [("user", "email")]


class EmailVerificationToken(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    token_hash = models.CharField(max_length=128, unique=True, db_column="tokenHash")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_tokens")
    expires_at = models.DateTimeField(db_column="expiresAt")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "EmailVerificationToken"


class PasswordResetToken(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    token_hash = models.CharField(max_length=128, unique=True, db_column="tokenHash")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_tokens")
    expires_at = models.DateTimeField(db_column="expiresAt")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "PasswordResetToken"


class Review(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    rating = models.IntegerField()
    title = models.CharField(max_length=255, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    is_verified_purchase = models.BooleanField(default=False, db_column="isVerifiedPurchase")
    status = models.CharField(
        max_length=16, choices=ReviewStatus.choices, default=ReviewStatus.PENDING
    )
    helpful_count = models.IntegerField(default=0, db_column="helpfulCount")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Review"
        unique_together = [("product", "user")]
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),
        ]


class ReviewImage(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    url = models.CharField(max_length=2048)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")

    class Meta:
        db_table = "ReviewImage"


class Cart(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="carts"
    )
    session_id = models.CharField(max_length=64, blank=True, null=True, db_column="sessionId")
    status = models.CharField(max_length=16, choices=CartStatus.choices, default=CartStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Cart"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["session_id"]),
        ]


class CartItem(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="cart_items")
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "CartItem"
        unique_together = [("cart", "variant")]


class Wishlist(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wishlist")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Wishlist"


class WishlistItem(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlist_items")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "WishlistItem"
        unique_together = [("wishlist", "product")]


class AdminSettings(models.Model):
    id = models.IntegerField(primary_key=True, default=1)
    stripe = models.JSONField(null=True, blank=True)
    currency = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "AdminSettings"


class Order(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    guest_email = models.EmailField(blank=True, null=True, db_column="guestEmail")
    status = models.CharField(max_length=16, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    amount_total = models.IntegerField(db_column="amountTotal")
    currency = models.CharField(max_length=8, default="usd")
    stripe_payment_intent_id = models.CharField(
        max_length=255, unique=True, db_column="stripePaymentIntentId"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Order"


class OrderItem(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="order_items")
    name = models.CharField(max_length=255)
    unit_price = models.IntegerField(db_column="unitPrice")
    quantity = models.IntegerField()
    discount_code = models.CharField(max_length=64, blank=True, null=True, db_column="discountCode")

    class Meta:
        db_table = "OrderItem"


class UserAddress(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=64, blank=True, null=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, null=True)
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=128)
    state = models.CharField(max_length=128, blank=True, null=True)
    postal_code = models.CharField(max_length=32, db_column="postalCode")
    country = models.CharField(max_length=128)
    is_default = models.BooleanField(default=False, db_column="isDefault")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "UserAddress"
        indexes = [models.Index(fields=["user"])]


class OrderAddress(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="address")
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="order_addresses"
    )
    saved_address = models.ForeignKey(
        UserAddress,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_snapshots",
        db_column="savedAddressId",
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, null=True)
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=128)
    state = models.CharField(max_length=128, blank=True, null=True)
    postal_code = models.CharField(max_length=32, db_column="postalCode")
    country = models.CharField(max_length=128)

    class Meta:
        db_table = "OrderAddress"


class ProductReport(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    reason = models.CharField(max_length=255)
    message = models.TextField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reports")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="product_reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ProductReport"


class SupportTicket(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=32, choices=SupportTicketCategory.choices)
    status = models.CharField(
        max_length=16, choices=SupportTicketStatus.choices, default=SupportTicketStatus.OPEN
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="support_tickets")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="support_tickets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "SupportTicket"


class Discount(models.Model):
    id = models.CharField(primary_key=True, max_length=32, default=new_cuid, editable=False)
    code = models.CharField(max_length=32, unique=True)
    kind = models.CharField(max_length=16, choices=DiscountKind.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, null=True, blank=True, related_name="discounts"
    )
    expires_at = models.DateTimeField(db_column="expiresAt")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Discount"
        indexes = [models.Index(fields=["product"])]

    @property
    def is_active(self) -> bool:
        return self.expires_at > timezone.now()
