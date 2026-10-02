use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "Product")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    #[sea_orm(column_name = "friendly_id")]
    pub friendly_id: String,
    pub description: String,
    pub price: Decimal,
    #[sea_orm(column_name = "minOrderQuantity")]
    pub min_order_quantity: Option<i32>,
    #[sea_orm(column_name = "maxOrderQuantity")]
    pub max_order_quantity: Option<i32>,
    #[sea_orm(column_name = "createdAt")]
    pub created_at: DateTime,
    #[sea_orm(column_name = "updatedAt")]
    pub updated_at: DateTime,
    #[sea_orm(column_name = "categoryId")]
    pub category_id: Option<i32>,
    #[sea_orm(column_name = "avgRating")]
    pub avg_rating: f64,
    #[sea_orm(column_name = "reviewCount")]
    pub review_count: i32,
    #[sea_orm(column_name = "pincodeTemplateId")]
    pub pincode_template_id: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::product_image::Entity")]
    ProductImage,
    #[sea_orm(has_many = "super::product_variant::Entity")]
    ProductVariant,
}

impl Related<super::product_image::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ProductImage.def()
    }
}

impl Related<super::product_variant::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ProductVariant.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
