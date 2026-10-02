use axum::{Json, Router, extract::State, routing::get};
use sea_orm::EntityTrait;
use serde::Serialize;
use std::collections::BTreeMap;

use crate::{
    entities::ProductAttribute,
    error::AppResult,
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/attributes", get(list_attributes))
}

#[derive(Serialize)]
struct AttributeSuggestion {
    title: String,
    values: Vec<String>,
}

async fn list_attributes(State(state): State<AppState>) -> AppResult<Json<Vec<AttributeSuggestion>>> {
    let rows = ProductAttribute::find().all(&state.db).await?;

    let mut by_title: BTreeMap<String, (String, std::collections::BTreeSet<String>)> =
        BTreeMap::new();

    for attr in rows {
        let title = attr.title.trim();
        if title.is_empty() {
            continue;
        }
        let key = title.to_lowercase();
        let entry = by_title
            .entry(key)
            .or_insert_with(|| (title.to_string(), std::collections::BTreeSet::new()));
        if let Some(value) = attr.value.as_deref().map(str::trim).filter(|v| !v.is_empty()) {
            entry.1.insert(value.to_string());
        }
    }

    let mut result = by_title
        .into_values()
        .map(|(title, values)| AttributeSuggestion {
            title,
            values: values.into_iter().collect(),
        })
        .collect::<Vec<_>>();

    result.sort_by(|a, b| a.title.cmp(&b.title));
    Ok(Json(result))
}
