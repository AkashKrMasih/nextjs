# Sinatra API (shop-app parity)

Ruby [Sinatra](https://sinatrarb.com/) API that mirrors five Next.js routes from the parent project, using raw SQL via the [`pg`](https://github.com/ged/ruby-pg) gem (no ORM). There is no `pq` gem on RubyGems; `pg` is the standard PostgreSQL driver for Ruby.

## Endpoints

| Method | Path | Next.js equivalent |
|--------|------|-------------------|
| GET | `/api/categories` | `app/api/categories/route.ts` |
| GET | `/api/products` | `app/api/products/route.ts` |
| GET | `/api/products/:id` | `app/api/products/[id]/route.ts` |
| GET | `/api/home-catalog` | `app/api/home-catalog/route.ts` |
| GET | `/api/products/:id/reviews` | `app/api/products/[id]/reviews/route.ts` |

`GET /health` is a simple readiness check.

## Setup

```bash
cd Sinatra
cp .env.example .env   # use the same DATABASE_URL as the Next.js app
bundle install
```

## Run

```bash
bundle exec rackup -p 4567
# or
bundle exec ruby -e "require './app'; ShopApi.run!(port: 4567)"
```

Development with reload:

```bash
bundle exec rerun -- rackup -p 4567
```

## Notes

- Uses the existing Prisma/PostgreSQL schema (`"Product"`, `"Category"`, etc.).
- `home-catalog` returns `wishlisted: false` for all products (no session/auth in this service).
- Review list only returns `APPROVED` reviews, matching the Next.js handler.
