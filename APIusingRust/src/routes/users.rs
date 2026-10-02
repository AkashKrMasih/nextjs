use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    routing::{get, post},
};
use bcrypt::{DEFAULT_COST, hash_with_salt};
use chrono::Utc;
use cuid2::create_id;
use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, QueryOrder};
use serde::{Deserialize, Serialize};

use crate::{
    entities::{user, User},
    error::{AppError, AppResult},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/users", get(list_users).post(create_user))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PublicUserDto {
    id: String,
    email: String,
    name: Option<String>,
    role: user::Role,
    created_at: chrono::NaiveDateTime,
    updated_at: chrono::NaiveDateTime,
}

impl From<user::Model> for PublicUserDto {
    fn from(value: user::Model) -> Self {
        Self {
            id: value.id,
            email: value.email,
            name: value.name,
            role: value.role,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

async fn list_users(State(state): State<AppState>) -> AppResult<Json<Vec<PublicUserDto>>> {
    let rows = User::find()
        .order_by_desc(user::Column::CreatedAt)
        .all(&state.db)
        .await?;
    Ok(Json(rows.into_iter().map(PublicUserDto::from).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateUserBody {
    name: String,
    email: String,
    password: String,
    role: Option<String>,
}

async fn create_user(
    State(state): State<AppState>,
    Json(body): Json<CreateUserBody>,
) -> AppResult<(StatusCode, Json<PublicUserDto>)> {
    let name = body.name.trim();
    let email = body.email.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Name is required.".into()));
    }
    if email.is_empty() {
        return Err(AppError::BadRequest("Email is required.".into()));
    }
    if body.password.is_empty() {
        return Err(AppError::BadRequest("Password is required.".into()));
    }

    let role = match body.role.as_deref().unwrap_or("CUSTOMER") {
        "CUSTOMER" => user::Role::Customer,
        "ADMIN" => user::Role::Admin,
        _ => return Err(AppError::BadRequest("Role must be customer or admin.".into())),
    };

    let existing = User::find()
        .filter(user::Column::Email.eq(email))
        .one(&state.db)
        .await?;
    if existing.is_some() {
        return Err(AppError::BadRequest("That email is already in use.".into()));
    }

    let salt = bcrypt::gen_salt(DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("password salt: {e}")))?;
    let hashed = hash_with_salt(&body.password, DEFAULT_COST, &salt)
        .map_err(|e| AppError::Internal(format!("password hash: {e}")))?;

    let now = Utc::now().naive_utc();
    let model = user::ActiveModel {
        id: Set(create_id()),
        email: Set(email.to_string()),
        name: Set(Some(name.to_string())),
        password: Set(hashed.to_string()),
        password_salt: Set(salt.to_string()),
        role: Set(role),
        email_verified: Set(true),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    let saved = model.insert(&state.db).await?;
    Ok((StatusCode::CREATED, Json(PublicUserDto::from(saved))))
}
