use axum::{
    Json, Router,
    extract::State,
    routing::get,
};
use rust_decimal::Decimal;
use sea_orm::{ColumnTrait, EntityTrait, QueryOrder};
use serde::Serialize;

use crate::{
    entities::{product, product_image, Product, ProductImage},
    error::AppResult,
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/products", get(list_products))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProductImageDto {
    id: String,
    url: String,
    is_primary: bool,
    product_id: i32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProductDto {
    id: i32,
    name: String,
    friendly_id: String,
    description: String,
    price: Decimal,
    min_order_quantity: Option<i32>,
    max_order_quantity: Option<i32>,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
    category_id: Option<i32>,
    avg_rating: f64,
    review_count: i32,
    pincode_template_id: Option<String>,
    images: Vec<ProductImageDto>,
}

async fn list_products(State(state): State<AppState>) -> AppResult<Json<Vec<ProductDto>>> {
    let products = Product::find()
        .order_by_desc(product::Column::CreatedAt)
        .all(&state.db)
        .await?;

    let product_ids: Vec<i32> = products.iter().map(|p| p.id).collect();
    let images = if product_ids.is_empty() {
        vec![]
    } else {
        ProductImage::find()
            .filter(product_image::Column::ProductId.is_in(product_ids))
            .all(&state.db)
            .await?
    };

    let mut images_by_product: std::collections::HashMap<i32, Vec<ProductImageDto>> =
        std::collections::HashMap::new();
    for image in images {
        images_by_product
            .entry(image.product_id)
            .or_default()
            .push(ProductImageDto {
                id: image.id,
                url: image.url,
                is_primary: image.is_primary,
                product_id: image.product_id,
            });
    }

    let dtos = products
        .into_iter()
        .map(|p| ProductDto {
            id: p.id,
            name: p.name,
            friendly_id: p.friendly_id,
            description: p.description,
            price: p.price,
            min_order_quantity: p.min_order_quantity,
            max_order_quantity: p.max_order_quantity,
            created_at: p.created_at,
            updated_at: p.updated_at,
            category_id: p.category_id,
            avg_rating: p.avg_rating,
            review_count: p.review_count,
            pincode_template_id: p.pincode_template_id,
            images: images_by_product.remove(&p.id).unwrap_or_default(),
        })
        .collect();

    Ok(Json(dtos))
}
