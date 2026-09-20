import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import path from "path";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";

import { prisma } from "@/lib/prisma";

const NUM_USERS      = 20;
const NUM_CATEGORIES = 8;
const NUM_PRODUCTS   = 150;

const SALT_ROUNDS = 10;

// Default plaintext password for every seeded fake user, so you have a
// known set of test credentials to log in with. Only used for seeding.
const DEFAULT_PASSWORD = "password";

// Same target directory the upload route writes to, so seeded images are
// served the same way real uploads are.
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/products");

// How many images to download in parallel. Picsum will start returning
// errors/timeouts if you fire too many requests at once.
const IMAGE_CONCURRENCY = 10;

// Each product gets a random number of images in this range.
const MIN_IMAGES_PER_PRODUCT = 2;
const MAX_IMAGES_PER_PRODUCT = 5;

// Every product gets 1-4 variants. Products with exactly 1 variant are
// treated as "simple" products (isDefault = true, no real options).
// Products with more than 1 get color/size combos and isDefault = false,
// matching the ProductVariant.isDefault comment in schema.prisma.
const MIN_VARIANTS_PER_PRODUCT = 1;
const MAX_VARIANTS_PER_PRODUCT = 4;
const VARIANT_COLORS = ["Black", "White", "Red", "Blue", "Green", "Gray"];
const VARIANT_SIZES  = ["XS", "S", "M", "L", "XL"];

// Fixed set of electronics categories — every seeded product belongs to
// (or is deliberately left out of, per CATEGORY_ASSIGN_CHANCE below) one
// of these, instead of faker's random commerce departments.
const ELECTRONICS_CATEGORIES = [
  "Smartphones",
  "Laptops & Computers",
  "Audio & Headphones",
  "Cameras & Drones",
  "Wearable Tech",
  "Smart Home",
  "Gaming",
  "TV & Home Theater",
];

// Product "type" nouns, paired with a faker commerce adjective to build
// realistic-sounding electronics product names, e.g. "Ergonomic Bluetooth
// Speaker" or "Sleek 4K Monitor".
const ELECTRONICS_PRODUCT_TYPES = [
  "Smartphone",
  "Laptop",
  "Tablet",
  "Bluetooth Speaker",
  "Wireless Headphones",
  "Earbuds",
  "Smartwatch",
  "Fitness Tracker",
  "4K Monitor",
  "Mechanical Keyboard",
  "Wireless Mouse",
  "Webcam",
  "Digital Camera",
  "Drone",
  "Action Camera",
  "VR Headset",
  "Gaming Console",
  "Gaming Controller",
  "Power Bank",
  "Wireless Charger",
  "Smart Speaker",
  "Smart Thermostat",
  "Smart Light Bulb",
  "Security Camera",
  "Router",
  "External SSD",
  "Graphics Card",
  "Soundbar",
  "Projector",
  "Streaming Media Player",
];

// Odds that a non-default variant overrides the product's base price
// (e.g. a Large costs a bit more than a Small).
const VARIANT_PRICE_OVERRIDE_CHANCE = 0.3;

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

// Builds up to `count` unique {color, size} combos for a multi-variant
// product. Capped by however many distinct combos actually exist.
function buildVariantAttributeCombos(count: number): { color: string; size: string }[] {
  const colors = faker.helpers.arrayElements(VARIANT_COLORS, Math.min(count, VARIANT_COLORS.length));
  const sizes  = faker.helpers.arrayElements(VARIANT_SIZES, Math.min(count, VARIANT_SIZES.length));

  const combos = colors.flatMap((color) => sizes.map((size) => ({ color, size })));

  return faker.helpers.arrayElements(combos, Math.min(count, combos.length));
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

  // --- Products (+ images, variants, inventory) ---
  await mkdir(UPLOAD_DIR, { recursive: true });

  console.log("Deleting local image files for existing products...");
  await deleteLocalProductImageFiles();

  // Cascades handle ProductImage / ProductVariant / Inventory automatically
  // (all declared onDelete: Cascade off Product / ProductVariant).
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // --- Categories ---
  // Flat, top-level categories only — schema supports subcategories via
  // parentId, but a seed doesn't need that depth to be useful. Fixed
  // electronics categories (not faker.commerce.department()) so every
  // category actually fits an electronics storefront.
  const categoryNames = ELECTRONICS_CATEGORIES.slice(0, NUM_CATEGORIES);

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: {
          name,
          slug:        faker.helpers.slugify(name).toLowerCase(),
          description: faker.lorem.sentence(),
        },
      })
    )
  );

  const productDrafts = Array.from({length: NUM_PRODUCTS}).map(() => {
    const imageCount = faker.number.int({min: MIN_IMAGES_PER_PRODUCT, max: MAX_IMAGES_PER_PRODUCT});
    const variantCount = faker.number.int({min: MIN_VARIANTS_PER_PRODUCT, max: MAX_VARIANTS_PER_PRODUCT});
    const basePrice = Number(faker.commerce.price({min: 5, max: 500}));

    const productType = faker.helpers.arrayElement(ELECTRONICS_PRODUCT_TYPES);

    return {
      name:            `${faker.commerce.productAdjective()} ${productType}`,
      description:     faker.commerce.productDescription(),
      price:           basePrice,
      // ~85% of products get a category; the rest exercise the nullable FK.
      categoryId:      faker.datatype.boolean({probability: 0.85})
                         ? faker.helpers.arrayElement(categories).id
                         : null,
      remoteImageUrls: Array.from({length: imageCount}, () => faker.image.urlPicsumPhotos()),
      variants:        buildProductVariantDrafts(variantCount, basePrice),
    };
  });

  function buildProductVariantDrafts(count: number, basePrice: number) {
    if (count === 1) {
      // Simple product: one auto-created variant, no real options.
      return [
        {
          sku:        `SKU-${randomUUID().slice(0, 8).toUpperCase()}`,
          name:       null as string | null,
          price:      null as number | null,
          attributes: null as Record<string, string> | null,
          isDefault:  true,
        },
      ];
    }

    const combos = buildVariantAttributeCombos(count);

    return combos.map(({color, size}) => {
      const overridesPrice = faker.datatype.boolean({probability: VARIANT_PRICE_OVERRIDE_CHANCE});

      return {
        sku:        `SKU-${randomUUID().slice(0, 8).toUpperCase()}`,
        name:       `${color} / ${size}`,
        price:      overridesPrice
                      ? Number((basePrice + faker.number.int({min: -10, max: 20})).toFixed(2))
                      : null,
        attributes: {color, size},
        isDefault:  false,
      };
    });
  }

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

  // images/variants are related tables, so each product needs its own
  // create() call with nested `create: [...]` writes — createMany() can't
  // do nested writes, so we can't batch this the way scalar columns could.
  // Variant -> Inventory is nested one level deeper (inventory quantity
  // replaces the old Product.stock column).
  await mapWithConcurrency(productDrafts, IMAGE_CONCURRENCY, (draft, i) =>
    prisma.product.create({
      data: {
        name:        draft.name,
        description: draft.description,
        price:       draft.price,
        categoryId:  draft.categoryId,
        images: {
          create: localUrlsByProduct[i].map((url, imageIndex) => ({
            url,
            isPrimary: imageIndex === 0, // first image is the primary one
          })),
        },
        variants: {
          create: draft.variants.map((variant) => ({
            sku:        variant.sku,
            name:       variant.name,
            price:      variant.price,
            attributes: variant.attributes ?? undefined,
            isDefault:  variant.isDefault,
            inventory: {
              create: (() => {
                const quantity = faker.number.int({min: 0, max: 200});
                return {
                  quantity,
                  reserved: faker.number.int({min: 0, max: Math.min(quantity, 20)}),
                };
              })(),
            },
          })),
        },
      },
    })
  );

  const totalVariants = productDrafts.reduce((sum, d) => sum + d.variants.length, 0);

  console.log(`Seeded ${NUM_USERS} users, ${categories.length} categories, ${NUM_PRODUCTS} products, and ${totalVariants} variants.`);
  console.log(`Admin login: admin@admin.us / ${DEFAULT_PASSWORD}`);
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