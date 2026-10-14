# Shop app — Django port

Python/Django copy of the Next.js shop in the repository root. It mirrors the Prisma data model, REST API routes under `/api/`, JWT session cookies (`session`), cart/checkout/discount logic, and core storefront plus admin pages.

## Requirements

- **Python 3.10+** (3.12+ recommended)
- PostgreSQL (optional; SQLite is used if `DATABASE_URL` is unset)

## Setup

```bash
cd Django
python3 -m pip install -r requirements.txt
cp .env.example .env
# Edit .env: set JWT_SECRET (same as Next.js if sharing sessions), DATABASE_URL, Stripe keys
python3 manage.py migrate
python3 manage.py seed_shop
python3 manage.py runserver 8000
```

Open [http://localhost:8000](http://localhost:8000).

Default seeded admin: `admin@shop.local` / `password`.

## Parity with Next.js

| Area | Notes |
| --- | --- |
| Models | Same entities as `prisma/schema.prisma` (`Product`, `Cart`, `Order`, …) |
| API | `/api/cart`, `/api/home-catalog`, `/api/checkout/create-payment-intent`, etc. |
| Auth | `JWT_SECRET` + httpOnly `session` cookie |
| Admin | `/admin/` dashboard + Django admin at `/django-admin/` |
| Uploads | `MEDIA_ROOT` points at repo `public/uploads` when present |

The Next.js UI uses React and Tailwind; this port uses server-rendered templates and shared CSS. Business rules live in `shop/services/` (cart, discounts, catalog, delivery pincodes).

## Commands

| Command | Description |
| --- | --- |
| `python3 manage.py runserver 8000` | Dev server |
| `python3 manage.py migrate` | Apply migrations |
| `python3 manage.py seed_shop` | Sample data |
| `python3 manage.py test shop` | Unit tests |

## Environment

See `.env.example`. Variables match the root `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `CURRENCY_*`, `STRIPE_*`, SMTP).

Use a **separate database** (e.g. `shopapp_django`) unless you intentionally align Django migrations with an existing Prisma database.
