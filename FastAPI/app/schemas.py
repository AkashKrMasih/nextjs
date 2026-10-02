from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

from app.models import Role

DecimalStr = Annotated[Decimal, PlainSerializer(lambda v: format(v, "f"), return_type=str)]


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    isPrimary: bool = Field(validation_alias="is_primary")
    productId: int = Field(validation_alias="product_id")


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    friendlyId: str = Field(validation_alias="friendly_id")
    description: str
    price: DecimalStr
    minOrderQuantity: int | None = Field(default=None, validation_alias="min_order_quantity")
    maxOrderQuantity: int | None = Field(default=None, validation_alias="max_order_quantity")
    categoryId: int | None = Field(default=None, validation_alias="category_id")
    avgRating: float = Field(validation_alias="avg_rating")
    reviewCount: int = Field(validation_alias="review_count")
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")
    images: list[ProductImageOut] = []


class ProductCreate(BaseModel):
    name: str
    price: Decimal
    description: str = ""
    friendlyId: str | None = None
    categoryId: int | None = None
    minOrderQuantity: int | None = None
    maxOrderQuantity: int | None = None
    imageUrls: list[str] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    description: str | None = None
    friendlyId: str | None = None
    categoryId: int | None = None
    minOrderQuantity: int | None = None
    maxOrderQuantity: int | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    parentId: int | None = Field(validation_alias="parent_id")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str | None
    role: Role
    createdAt: datetime = Field(validation_alias="created_at")
    updatedAt: datetime = Field(validation_alias="updated_at")


class CartItemOut(BaseModel):
    id: int
    name: str
    price: str
    quantity: int


class CartOut(BaseModel):
    items: list[CartItemOut]


class CartAddBody(BaseModel):
    id: int
    name: str
    price: str
    quantity: int = 1


class CartPatchBody(BaseModel):
    id: int
    quantity: int


class ErrorOut(BaseModel):
    error: str
