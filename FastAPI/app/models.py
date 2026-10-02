import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"


class CartStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CONVERTED = "CONVERTED"
    ABANDONED = "ABANDONED"


class Category(Base):
    __tablename__ = "Category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column("parentId", Integer, ForeignKey("Category.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "Product"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    friendly_id: Mapped[str] = mapped_column("friendly_id", String, unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    min_order_quantity: Mapped[int | None] = mapped_column("minOrderQuantity", Integer, nullable=True)
    max_order_quantity: Mapped[int | None] = mapped_column("maxOrderQuantity", Integer, nullable=True)
    category_id: Mapped[int | None] = mapped_column("categoryId", Integer, ForeignKey("Category.id"), nullable=True)
    avg_rating: Mapped[float] = mapped_column("avgRating", default=0.0)
    review_count: Mapped[int] = mapped_column("reviewCount", default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped[Category | None] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "ProductImage"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    url: Mapped[str] = mapped_column(String, nullable=False)
    is_primary: Mapped[bool] = mapped_column("isPrimary", default=False)
    product_id: Mapped[int] = mapped_column("productId", Integer, ForeignKey("Product.id", ondelete="CASCADE"))

    product: Mapped[Product] = relationship(back_populates="images")


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    password_salt: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.CUSTOMER)
    email_verified: Mapped[bool] = mapped_column("emailVerified", default=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Cart(Base):
    __tablename__ = "Cart"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column("userId", String, nullable=True)
    session_id: Mapped[str | None] = mapped_column("sessionId", String, nullable=True, index=True)
    status: Mapped[CartStatus] = mapped_column(Enum(CartStatus), default=CartStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "CartItem"
    __table_args__ = (UniqueConstraint("cartId", "productId", name="cartId_productId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id: Mapped[str] = mapped_column("cartId", String, ForeignKey("Cart.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column("productId", Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now())

    cart: Mapped[Cart] = relationship(back_populates="items")
