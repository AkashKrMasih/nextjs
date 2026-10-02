pub mod attributes;
pub mod categories;
pub mod home_catalog;
pub mod products;
pub mod users;

use axum::Router;
use crate::state::AppState;

pub fn api_router() -> Router<AppState> {
    Router::new()
        .merge(categories::router())
        .merge(products::router())
        .merge(users::router())
        .merge(attributes::router())
        .merge(home_catalog::router())
}
