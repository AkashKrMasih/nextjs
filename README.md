This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), using [Prisma](https://github.com/prisma/orm) as the ORM.

This project is free to use by anyone.

## Prerequisites

- **Node.js 18.18 or later** (20+ recommended) — check with `node -v`
- **npm** (ships with Node) — check with `npm -v`
- A running database instance (PostgreSQL, MySQL, or SQLite) matching the `provider` in `prisma/schema.prisma`

> **Development environment:** This project is developed and tested on **Ubuntu 24.04 LTS**. It should work on other Linux distros, macOS, and WSL2, but Ubuntu 24.04 is the reference environment for these instructions.

## Getting Started

### Quick start (Ubuntu 24.04)

A `setup.sh` script is included to automate everything in this section — checking/installing Node.js, running `npm install`, creating `.env` with a generated `JWT_SECRET`, and running the Prisma migrations.

```bash
bash setup.sh
```

The script will pause and ask you to fill in `DATABASE_URL` in `.env` if it's missing, then continue with the Prisma setup. Skip to [Run the development server](#5-run-the-development-server) once it finishes, or follow the manual steps below if you'd rather run each command yourself.

### Manual setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

At minimum, set your database connection string and a JWT secret:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your-generated-secret-here"
CURRENCY_CODE="USD"
CURRENCY_SYMBOL="$"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

> The `DATABASE_URL` format depends on your database provider. See the [Prisma connection URL reference](https://www.prisma.io/docs/orm/reference/connection-urls).

`JWT_SECRET` is used to sign and verify authentication tokens. Generate a strong random value rather than typing one by hand:

```bash
openssl rand -base64 32
```

Copy the output into `JWT_SECRET` in your `.env` file. Keep this value private — never commit it to version control, and use a different secret per environment (development, staging, production). If it's ever exposed, rotate it immediately; existing tokens signed with the old secret will be invalidated.

`CURRENCY_CODE` and `CURRENCY_SYMBOL` control how prices are formatted throughout the app (e.g. `USD` / `$`, `EUR` / `€`, `INR` / `₹`).

`STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are required for checkout/payments to work. Get both from your [Stripe dashboard](https://dashboard.stripe.com/apikeys) — use the `sk_test_...` / `pk_test_...` pair for development and the live pair only in production. `setup.sh` will warn you if any of these four variables are missing from `.env`.

### 3. Set up the database

```bash
npx prisma migrate dev
```

This applies all existing migrations and generates the Prisma Client. On a deployed or CI environment, use `npx prisma migrate deploy` instead — it applies migrations without prompting or resetting data.

If the project includes a seed script:

```bash
npx prisma db seed
```

### 4. Generate the Prisma Client

```bash
npx prisma generate
```

`migrate dev` runs this automatically, but run it manually any time you pull changes to `prisma/schema.prisma` or reinstall `node_modules`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Useful Commands

| Command | Description |
| --- | --- |
| `./setup.sh` | One-shot project setup (Node check, install, `.env`, Prisma migrate/generate) |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open a browser UI to browse and edit your data |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma migrate reset` | Drop the database and re-apply all migrations (destructive) |
| `npx prisma db push` | Push schema changes without creating a migration (prototyping only) |

## Troubleshooting

**`@prisma/client did not initialize yet`**
Run `npx prisma generate`. This usually happens after a fresh clone or after deleting `node_modules`.

**`Can't reach database server at localhost:5432`**
The database service isn't running, or the host/port in `DATABASE_URL` is wrong. Start your database and verify the credentials.

**`Environment variable not found: DATABASE_URL`**
The `.env` file is missing or not in the project root. Prisma reads `.env` from the directory containing `prisma/schema.prisma`'s parent by default.

**`JWT_SECRET is not defined` / auth requests failing with a 500**
The `.env` file is missing a `JWT_SECRET` value, or the server was started before it was added. Add `JWT_SECRET` to `.env` (see step 2 above) and restart `npm run dev`.

**Prices display incorrectly, or checkout/payments fail**
`.env` is likely missing `CURRENCY_CODE`, `CURRENCY_SYMBOL`, `STRIPE_SECRET_KEY`, or `STRIPE_PUBLISHABLE_KEY`. `setup.sh` warns about any of these that are missing — check its output, or compare your `.env` against `.env.example` and fill in the missing values (Stripe keys come from your [Stripe dashboard](https://dashboard.stripe.com/apikeys)).

**Port 3000 already in use**
Run on a different port: `npm run dev -- -p 3001`.

**`setup.sh: Permission denied`**
Make the script executable first: `chmod +x setup.sh`.

**`setup.sh` prompts for `sudo`**
This only happens if Node.js or `openssl` isn't already installed — the script installs them via `apt`/NodeSource. If you're on a system without `sudo` access, install Node.js 18.18+ manually first, then re-run the script.

## Learn More

To learn more about the stack, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Prisma Documentation](https://www.prisma.io/docs) - schema modeling, migrations, and client usage.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Remember to set `DATABASE_URL` in your Vercel project's environment variables, and add `prisma generate` to your build command (e.g. `prisma generate && next build`) so the client is available at build time.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.