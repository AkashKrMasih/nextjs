# APIusingRust

Axum + SeaORM mirror of five Next.js App Router APIs in this repo. Uses the same PostgreSQL database as the Next.js app (`DATABASE_URL`).

## Run

```bash
cd APIusingRust
cp .env.example .env   # or symlink ../.env
cargo run
```

Default port: **3001** (`RUST_API_PORT`).

## Endpoints

| Method | Path | Next.js equivalent |
|--------|------|-------------------|
| GET, POST | `/api/categories` | `app/api/categories/route.ts` |
| GET | `/api/products` | `app/api/products/route.ts` |
| GET, POST | `/api/users` | `app/api/users/route.ts` |
| GET | `/api/attributes` | `app/api/attributes/route.ts` |
| GET | `/api/home-catalog` | `app/api/home-catalog/route.ts` |

POST bodies use JSON (same fields as the Next.js form fields). `GET /health` is a simple liveness check.
