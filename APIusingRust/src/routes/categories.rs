use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    routing::get,
};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryFilter, QueryOrder,
};
use serde::{Deserialize, Serialize};

use crate::{
    entities::{category, Category},
    error::{AppError, AppResult},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/categories", get(list_categories).post(create_category))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CategoryDto {
    id: i32,
    name: String,
    slug: String,
    description: Option<String>,
    parent_id: Option<i32>,
}

impl From<category::Model> for CategoryDto {
    fn from(value: category::Model) -> Self {
        Self {
            id: value.id,
            name: value.name,
            slug: value.slug,
            description: value.description,
            parent_id: value.parent_id,
        }
    }
}

async fn list_categories(State(state): State<AppState>) -> AppResult<Json<Vec<CategoryDto>>> {
    let rows = Category::find()
        .order_by_asc(category::Column::Name)
        .all(&state.db)
        .await?;
    Ok(Json(rows.into_iter().map(CategoryDto::from).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateCategoryBody {
    name: String,
    slug: Option<String>,
    description: Option<String>,
    parent_id: Option<i32>,
}

fn slugify(input: &str) -> String {
    let lower = input.trim().to_lowercase();
    let mut slug = String::new();
    let mut last_hyphen = false;
    for ch in lower.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch);
            last_hyphen = false;
        } else if !last_hyphen && !slug.is_empty() {
            slug.push('-');
            last_hyphen = true;
        }
    }
    slug.trim_matches('-').to_string()
}

async fn create_category(
    State(state): State<AppState>,
    Json(body): Json<CreateCategoryBody>,
) -> AppResult<(StatusCode, Json<CategoryDto>)> {
    let name = body.name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Name is required.".into()));
    }

    let slug = slugify(body.slug.as_deref().unwrap_or(name));
    if slug.is_empty() {
        return Err(AppError::BadRequest(
            "Could not derive a valid slug from that name.".into(),
        ));
    }

    if let Some(parent_id) = body.parent_id {
        if parent_id <= 0 {
            return Err(AppError::BadRequest("Invalid parent category.".into()));
        }
        let parent = Category::find_by_id(parent_id).one(&state.db).await?;
        if parent.is_none() {
            return Err(AppError::BadRequest("Parent category not found.".into()));
        }
    }

    let existing = Category::find()
        .filter(category::Column::Slug.eq(slug.clone()))
        .one(&state.db)
        .await?;
    if existing.is_some() {
        return Err(AppError::BadRequest(format!(
            "Slug \"{slug}\" is already in use."
        )));
    }

    let now = Utc::now().naive_utc();
    let description = body
        .description
        .map(|d| d.trim().to_string())
        .filter(|d| !d.is_empty());

    let model = category::ActiveModel {
        name: Set(name.to_string()),
        slug: Set(slug),
        description: Set(description),
        parent_id: Set(body.parent_id),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    let saved = model.insert(&state.db).await?;
    Ok((StatusCode::CREATED, Json(CategoryDto::from(saved))))
}
