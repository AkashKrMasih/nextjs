# nest-api

This is a NestJS (latest v12) rebuild of the Next.js API routes for `Post`
(`/api/posts` and `/api/posts/[id]`), using Prisma as the ORM — same as the
original.

## Route mapping

| Next.js route | Method | NestJS equivalent |
|---|---|---|
| `app/api/posts/route.ts` | GET | `GET /posts` → `PostsController.findAll` |
| `app/api/posts/route.ts` | POST | `POST /posts` → `PostsController.create` |
| `app/api/posts/[id]/route.ts` | GET | `GET /posts/:id` → `PostsController.findOne` |
| `app/api/posts/[id]/route.ts` | PUT | `PUT /posts/:id` → `PostsController.update` |
| `app/api/posts/[id]/route.ts` | DELETE | `DELETE /posts/:id` → `PostsController.remove` |

### What changed vs. the original

- **Validation**: the original routes read `body.title` etc. with no
  validation. NestJS now validates the request body with `class-validator`
  DTOs (`CreatePostDto`, `UpdatePostDto`) via a global `ValidationPipe`
  (unknown/invalid fields are rejected).
- **404 handling**: `PUT /posts/:id` now checks the post exists first and
  throws a proper `404 Not Found` (via `NotFoundException`) instead of
  letting Prisma throw a raw "record not found" error.
- **id parsing**: `ParseIntPipe` validates and converts the `:id` param
  (returns `400` for a non-numeric id) instead of `Number(id)`, which could
  silently produce `NaN`.
- Structure: Prisma access is centralized in a `PrismaService` /
  `PrismaModule` (global module), and CRUD logic lives in `PostsService`,
  separate from the HTTP layer (`PostsController`) — this is the standard
  Nest layering (controller → service → Prisma).

## Project structure

```
src/
  app.module.ts
  main.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  posts/
    posts.module.ts
    posts.controller.ts
    posts.service.ts
    dto/
      create-post.dto.ts
      update-post.dto.ts
prisma/
  schema.prisma
```

The `Post` model in `prisma/schema.prisma` was inferred from the fields used
in your original routes (`title`, `content`, `published`, `createdAt`, plus
an `updatedAt` and auto-increment `id`). Adjust it if your real schema
differs (e.g. if `id` isn't an autoincrementing int).

## Setup

1. **Install dependencies** (already done if you unzipped this with
   `node_modules` included; otherwise):
   ```bash
   npm install
   ```

2. **Configure the database.** Edit `.env` and set `DATABASE_URL` to your
   real Postgres (or other) connection string. `.env.example` has the same
   placeholder for reference.

   If you're not using Postgres, change the `provider` in
   `prisma/schema.prisma` (`postgresql`, `mysql`, `sqlite`, `sqlserver`,
   `mongodb`) to match.

3. **Generate the Prisma client and create the database schema:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   > Note: this step needs internet access to download Prisma's query
   > engine binaries the first time — it couldn't be run in the sandbox
   > that built this project, so the Prisma client here is not yet
   > generated. Running the two commands above locally will fix that; until
   > then, `npm run build` will show type errors on `PrismaService`.

4. **Run the app:**
   ```bash
   npm run start:dev
   ```
   The API will be available at `http://localhost:3000`.

## Available scripts

- `npm run start:dev` — start with hot reload
- `npm run build` — compile to `dist/`
- `npm run start:prod` — run the compiled build
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — e2e tests (Vitest)

## Endpoints

- `GET /posts` — list all posts, newest first
- `GET /posts/:id` — get one post by id
- `POST /posts` — create a post — body: `{ "title": string, "content"?: string, "published"?: boolean }`
- `PUT /posts/:id` — update a post — body: any subset of the above fields
- `DELETE /posts/:id` — delete a post
