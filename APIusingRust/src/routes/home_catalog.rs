use axum::{
    Json, Router,
    extract::{Query, State},
    routing::get,
};
use rust_decimal::Decimal;
use sea_orm::{
    ColumnTrait, Condition, EntityTrait, QueryFilter, QueryOrder,
};
use serde::{Deserialize, Serialize};

use crate::{
    entities::{product, product_image, product_variant, Product, ProductImage, ProductVariant},
    error::AppResult,
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/home-catalog", get(home_catalog))
}

#[derive(Deserialize)]
struct HomeCatalogQuery {
    q: Option<String>,
    category: Option<String>,
    min: Option<String>,
    max: Option<String>,
    sort: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HomeCatalogProductDto {
    id: i32,
    friendly_id: String,
    name: String,
    price: String,
    image_url: Option<String>,
    stock: i32,
    wishlisted: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HomeCatalogResponse {
    has_filters: bool,
    products: Vec<HomeCatalogProductDto>,
}

fn parse_non_negative_number(value: &str) -> Option<Decimal> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }
    trimmed
        .parse::<Decimal>()
        .ok()
        .filter(|n| *n >= Decimal::ZERO)
}

async fn home_catalog(
    State(state): State<AppState>,
    Query(query): Query<HomeCatalogQuery>,
) -> AppResult<Json<HomeCatalogResponse>> {
    let q = query.q.as_deref().unwrap_or("").trim();
    let category_id = query
        .category
        .as_deref()
        .and_then(parse_category_id);
    let min_price = query.min.as_deref().and_then(parse_non_negative_number);
    let max_price = query.max.as_deref().and_then(parse_non_negative_number);
    let sort = match query.sort.as_deref() {
        Some("price") => HomeCatalogSort::Price,
        Some("title") => HomeCatalogSort::Title,
        _ => HomeCatalogSort::Newest,
    };

    let has_filters = !q.is_empty()
        || category_id.is_some()
        || min_price.is_some()
        || max_price.is_some();

    let mut condition = Condition::all();
    if let Some(category_id) = category_id {
        condition = condition.add(product::Column::CategoryId.eq(category_id));
    }
    if let Some(min) = min_price {
        condition = condition.add(product::Column::Price.gte(min));
    }
    if let Some(max) = max_price {
        condition = condition.add(product::Column::Price.lte(max));
    }
    if !q.is_empty() {
        let pattern = format!("%{}%", q);
        condition = condition.add(
            Condition::any()
                .add(product::Column::Name.like(&pattern))
                .add(product::Column::Description.like(&pattern)),
        );
    }

    let mut select = Product::find().filter(condition);
    select = match sort {
        HomeCatalogSort::Price => select.order_by_asc(product::Column::Price),
        HomeCatalogSort::Title => select.order_by_asc(product::Column::Name),
        HomeCatalogSort::Newest => select.order_by_desc(product::Column::CreatedAt),
    };

    let products = select.all(&state.db).await?;
    let product_ids: Vec<i32> = products.iter().map(|p| p.id).collect();

    let images = if product_ids.is_empty() {
        vec![]
    } else {
        ProductImage::find()
            .filter(product_image::Column::ProductId.is_in(product_ids.clone()))
            .order_by_desc(product_image::Column::IsPrimary)
            .all(&state.db)
            .await?
    };

    let variants = if product_ids.is_empty() {
        vec![]
    } else {
        ProductVariant::find()
            .filter(product_variant::Column::ProductId.is_in(product_ids))
            .find_also_related(crate::entities::Inventory)
            .all(&state.db)
            .await?
    };

    let mut primary_image: std::collections::HashMap<i32, String> = std::collections::HashMap::new();
    for image in images {
        primary_image
            .entry(image.product_id)
            .or_insert_with(|| image.url.clone());
    }

    let mut stock_by_product: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();
    for (variant, inventory_row) in variants {
        let qty = inventory_row.map(|i| i.quantity).unwrap_or(0);
        stock_by_product
            .entry(variant.product_id)
            .and_modify(|sum| *sum += qty)
            .or_insert(qty);
    }

    let dtos = products
        .into_iter()
        .map(|p| HomeCatalogProductDto {
            id: p.id,
            friendly_id: p.friendly_id,
            name: p.name,
            price: p.price.to_string(),
            image_url: primary_image.get(&p.id).cloned(),
            stock: stock_by_product.get(&p.id).copied().unwrap_or(0),
            wishlisted: false,
        })
        .collect();

    Ok(Json(HomeCatalogResponse {
        has_filters,
        products: dtos,
    }))
}

enum HomeCatalogSort {
    Newest,
    Price,
    Title,
}

fn parse_category_id(value: &str) -> Option<i32> {
    let n = value.trim().parse::<i32>().ok()?;
    if n > 0 { Some(n) } else { None }
}
