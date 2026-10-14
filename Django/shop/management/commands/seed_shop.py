from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from shop.models import (
    AdminSettings,
    Category,
    Discount,
    DiscountKind,
    Inventory,
    Product,
    ProductImage,
    ProductVariant,
    Role,
    User,
)
from shop.services.auth import create_user
from shop.services.utils import slugify


class Command(BaseCommand):
    help = "Seed sample catalog data (mirrors the Next.js prisma seed defaults)."

    def handle(self, *args, **options):
        AdminSettings.objects.get_or_create(id=1, defaults={"currency": {"code": "USD", "symbol": "$"}})

        admin = User.objects.filter(email="admin@shop.local").first()
        if not admin:
            admin = create_user(
                "admin@shop.local",
                "password",
                name="Admin",
                role=Role.ADMIN,
                email_verified=True,
            )
            self.stdout.write("Created admin@shop.local / password")

        categories = []
        for name in ["Smartphones", "Laptops", "Audio", "Gaming"]:
            slug = slugify(name)
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "description": f"{name} department"}
            )
            categories.append(cat)

        if Product.objects.exists():
            self.stdout.write("Products already present; skipping product seed.")
            return

        for i in range(1, 13):
            name = f"Sample Product {i}"
            friendly = slugify(name)
            product = Product.objects.create(
                name=name,
                friendly_id=friendly,
                description=f"Description for {name}",
                price=Decimal("29.99") + i,
                category=categories[i % len(categories)],
                reviews_enabled=True,
            )
            ProductImage.objects.create(
                product=product,
                url=f"https://placehold.co/400x400/png?text={i}",
                is_primary=True,
            )
            variant = ProductVariant.objects.create(
                product=product,
                sku=f"SKU-{friendly}",
                name="Default",
                is_default=True,
            )
            Inventory.objects.create(variant=variant, quantity=25)

        Discount.objects.create(
            code="SAVE10",
            kind=DiscountKind.PERCENT,
            value=Decimal("10"),
            expires_at=timezone.now() + timedelta(days=30),
        )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
