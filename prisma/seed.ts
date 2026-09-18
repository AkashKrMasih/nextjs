import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import path from "path";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";

import { prisma } from "@/lib/prisma";

const NUM_USERS    = 20;
const NUM_PRODUCTS = 150;

const SALT_ROUNDS = 10;

// Default plaintext password for every seeded fake user, so you have a
// known set of test credentials to log in with. Only used for seeding.
const DEFAULT_PASSWORD = "password123";

// Same target directory the upload route writes to, so seeded images are
// served the same way real uploads are.
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/products");

// How many images to download in parallel. Picsum will start returning
// errors/timeouts if you fire too many requests at once.
const IMAGE_CONCURRENCY = 10;

// Each product gets a random number of images in this range.
const MIN_IMAGES_PER_PRODUCT = 2;
const MAX_IMAGES_PER_PRODUCT = 5;

async function hashPassword(plainPassword: string) {
  const passwordSalt   = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(plainPassword, passwordSalt);

  return { password: hashedPassword, password_salt: passwordSalt };
}

// Downloads a remote image and saves it under UPLOAD_DIR, returning the
// local /uploads/... URL to store on the product. Returns null on failure
// so the caller can fall back to the remote URL instead of failing the seed.
async function downloadImage(remoteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const filename = `${randomUUID()}.${ext}`;

    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return `/uploads/products/${filename}`;
  } catch (err) {
    console.warn(`  ! failed to download ${remoteUrl}:`, (err as Error).message);
    return null;
  }
}

// Runs `fn` over `items` with at most `limit` in flight at once.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Prisma has no before_destroy-style callback, so this stands in for one:
// look up every ProductImage row, delete its file off disk, THEN let the
// caller delete the rows themselves. Only touches files under
// /uploads/products/ — a row whose download failed and fell back to a
// remote picsum URL has nothing local to clean up, so it's skipped.
async function deleteLocalProductImageFiles() {
  const images = await prisma.productImage.findMany({ select: { url: true } });

  await mapWithConcurrency(images, IMAGE_CONCURRENCY, async ({ url }) => {
    if (!url.startsWith("/uploads/products/")) return;

    const filePath = path.join(process.cwd(), "public", url);
    try {
      await unlink(filePath);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        console.warn(`  ! failed to delete ${filePath}:`, (err as Error).message);
      }
    }
  });
}

async function main() {
  console.log("Seeding database...");

  // --- Users ---
  const adminCreds = await hashPassword(DEFAULT_PASSWORD);

  const adminUser = {
    email: "admin@admin.us",
    name:  "Admin",
    role:  "ADMIN",
    ...adminCreds,
  };

  const fakeUsers = await Promise.all(
    Array.from({length: NUM_USERS - 1}).map(async () => {
      const creds = await hashPassword(DEFAULT_PASSWORD);

      return {
        email: faker.internet.email().toLowerCase(),
        name:  faker.person.fullName(),
        role:  "CUSTOMER",
        ...creds,
      };
    })
  );

  const users = [adminUser, ...fakeUsers];

  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data:           users,
    skipDuplicates: true, // in case faker generates a duplicate email
  });

  // --- Products ---
  await mkdir(UPLOAD_DIR, { recursive: true });

  console.log("Deleting local image files for existing products...");
  await deleteLocalProductImageFiles();

  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  const productDrafts = Array.from({length: NUM_PRODUCTS}).map(() => {
    const imageCount = faker.number.int({min: MIN_IMAGES_PER_PRODUCT, max: MAX_IMAGES_PER_PRODUCT});

    return {
      name:            faker.commerce.productName(),
      description:     faker.commerce.productDescription(),
      price:           Number(faker.commerce.price({min: 5, max: 500})),
      stock:           faker.number.int({min: 0, max: 200}),
      remoteImageUrls: Array.from({length: imageCount}, () => faker.image.urlPicsumPhotos()),
    };
  });

  // Flatten every product's image URLs into one list of download tasks so
  // IMAGE_CONCURRENCY limits total in-flight requests across ALL products,
  // not just per-product (2-5 at a time per product would multiply out fast).
  type ImageTask = { productIndex: number; remoteUrl: string };
  const imageTasks: ImageTask[] = productDrafts.flatMap((draft, productIndex) =>
    draft.remoteImageUrls.map((remoteUrl) => ({ productIndex, remoteUrl }))
  );

  console.log(`Downloading ${imageTasks.length} product images across ${NUM_PRODUCTS} products (concurrency: ${IMAGE_CONCURRENCY})...`);

  let failedCount = 0;
  const localUrlsByProduct: string[][] = productDrafts.map(() => []);

  await mapWithConcurrency(imageTasks, IMAGE_CONCURRENCY, async (task) => {
    const localUrl = await downloadImage(task.remoteUrl);
    if (localUrl === null) failedCount++;
    localUrlsByProduct[task.productIndex].push(localUrl ?? task.remoteUrl);
  });

  if (failedCount > 0) {
    console.warn(`  ${failedCount} image(s) failed to download; falling back to remote URLs for those.`);
  }

  // images is a related table (ProductImage[]), so each product needs its
  // own create() call with a nested `images: { create: [...] } }` — the
  // same pattern the /api/products POST route uses. createMany() can't do
  // nested writes, so we can't batch this the way a scalar imageUrl could.
  await mapWithConcurrency(productDrafts, IMAGE_CONCURRENCY, (draft, i) =>
    prisma.product.create({
      data: {
        name:        draft.name,
        description: draft.description,
        price:       draft.price,
        stock:       draft.stock,
        images: {
          create: localUrlsByProduct[i].map((url) => ({ url })),
        },
      },
    })
  );

  console.log(`Seeded ${NUM_USERS} users and ${NUM_PRODUCTS} products.`);
  console.log(`Admin login: admin@admin.us / password`);
  console.log(`All other users: <their email> / ${DEFAULT_PASSWORD}`);
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});