import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import path from "path";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/categories";

const NUM_USERS      = 20;
const NUM_CATEGORIES = 8;
const NUM_PRODUCTS   = 25;

const SALT_ROUNDS = 10;

// Default plaintext password for every seeded fake user, so you have a
// known set of test credentials to log in with. Only used for seeding.
const DEFAULT_PASSWORD = "password";

// Same target directory the upload route writes to, so seeded images are
// served the same way real uploads are.
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/products");

// How many images to download in parallel. The image provider will start
// returning errors/timeouts if you fire too many requests at once.
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

// Product "type" nouns, grouped by ELECTRONICS_CATEGORIES so a product's
// name (and therefore its description and images, both derived from the
// same type below) always fits the category it's assigned to — e.g. a
// product filed under "Gaming" always gets a gaming-appropriate name like
// "Ergonomic Gaming Controller", never a "Smart Thermostat".
const PRODUCT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "Smartphones":          ["Smartphone", "Foldable Phone", "5G Smartphone", "Rugged Phone"],
  "Laptops & Computers":  ["Laptop", "Ultrabook", "2-in-1 Laptop", "Mini PC", "Desktop Tower", "Mechanical Keyboard", "Wireless Mouse", "4K Monitor"],
  "Audio & Headphones":   ["Bluetooth Speaker", "Wireless Headphones", "Earbuds", "Wired Headphones", "Soundbar"],
  "Cameras & Drones":     ["Digital Camera", "Action Camera", "Drone", "Mirrorless Camera", "Camera Gimbal"],
  "Wearable Tech":        ["Smartwatch", "Fitness Tracker", "VR Headset", "Smart Ring"],
  "Smart Home":           ["Smart Speaker", "Smart Thermostat", "Smart Light Bulb", "Security Camera", "Router", "Wireless Charger"],
  "Gaming":                ["Gaming Console", "Gaming Controller", "Gaming Headset", "Gaming Keyboard", "Graphics Card"],
  "TV & Home Theater":    ["Streaming Media Player", "Projector", "Soundbar", "4K Monitor"],
};

// placehold.co background/text colour pairs (hex, no "#") used for the
// fallback placeholder photos below — a small curated palette reads a lot
// better than fully random hex codes on every image. Only used if the
// DummyJSON image pool (below) comes back empty, e.g. no network access.
const PLACEHOLDER_COLOR_PAIRS = [
  { bg: "1f2937", fg: "f9fafb" }, // slate
  { bg: "111827", fg: "38bdf8" }, // near-black / sky
  { bg: "0f172a", fg: "a3e635" }, // navy / lime
  { bg: "27272a", fg: "fbbf24" }, // charcoal / amber
  { bg: "1e293b", fg: "f472b6" }, // slate / pink
  { bg: "18181b", fg: "34d399" }, // near-black / emerald
];

// Fallback used whenever a category has no DummyJSON image pool —
// generates a placehold.co image labelled with the product's own type, e.g.
// "Digital Camera" or "VR Headset". Not a real photo, but unambiguously the
// right image for that product, needs no API key, and keeps the seed
// runnable even with no network access.
function buildPlaceholderImageUrl(text: string, colors: { bg: string; fg: string }): string {
  const encodedText = text.split(" ").map(encodeURIComponent).join("+");
  return `https://placehold.co/640x480/${colors.bg}/${colors.fg}.png?text=${encodedText}`;
}

// DummyJSON's catalog only has real electronics photos for these two of our
// eight ELECTRONICS_CATEGORIES — it has no dedicated category for audio
// gear, cameras/drones, wearables, smart home, gaming, or TVs. Rather than
// pool every category's images together (which used to hand a "Smartphone"
// photo to a seeded "Drone"), each mapped category gets its OWN pool built
// only from the matching DummyJSON categories, and every other category
// always falls back to a labelled placehold.co image (see
// buildPlaceholderImageUrl) so its photo can never mismatch its type.
const CATEGORY_TO_DUMMYJSON_SLUGS: Record<string, string[]> = {
  "Smartphones":          ["smartphones"],
  "Laptops & Computers":  ["laptops", "tablets"],
};

type DummyJsonCategoryResponse = { products: { images: string[] }[] };

// Fetches every product image URL for one DummyJSON category slug.
// Returns [] (never throws) if the fetch fails, letting the caller fall
// back to placehold.co instead.
async function fetchDummyJsonCategoryImages(slug: string): Promise<string[]> {
  try {
    const res = await fetch(`https://dummyjson.com/products/category/${slug}?limit=0&select=images`);
    if (!res.ok) {
      console.warn(`  ! DummyJSON category "${slug}" returned ${res.status}`);
      return [];
    }

    const data = (await res.json()) as DummyJsonCategoryResponse;
    return data.products.flatMap((product) => product.images);
  } catch (err) {
    console.warn(`  ! failed to fetch DummyJSON category "${slug}":`, (err as Error).message);
    return [];
  }
}

// Builds one real-photo image pool per ELECTRONICS_CATEGORIES entry that
// has a CATEGORY_TO_DUMMYJSON_SLUGS mapping. Categories with no mapping
// simply aren't keys in the returned object, so callers know to use
// placeholders for them instead.
async function fetchDummyJsonImagePoolsByCategory(): Promise<Record<string, string[]>> {
  const entries = Object.entries(CATEGORY_TO_DUMMYJSON_SLUGS);
  const pools: Record<string, string[]> = {};

  await Promise.all(
    entries.map(async ([categoryName, slugs]) => {
      const perSlug = await Promise.all(slugs.map(fetchDummyJsonCategoryImages));
      pools[categoryName] = perSlug.flat();
    })
  );

  return pools;
}

// Odds that a non-default variant overrides the product's base price
// (e.g. a Large costs a bit more than a Small).
const VARIANT_PRICE_OVERRIDE_CHANCE = 0.3;

// Each product gets a random number of ProductAttribute rows (title/value
// pairs like "Material" -> "Aluminum"), distinct from ProductVariant's
// color/size options above — these describe the product itself, not a
// purchasable variation of it.
const MIN_ATTRIBUTES_PER_PRODUCT = 2;
const MAX_ATTRIBUTES_PER_PRODUCT = 6;

// Pool of electronics-appropriate attribute titles, each with its own list
// of plausible values. A product gets a random subset of titles (never the
// same title twice) with one random value from that title's list.
const ATTRIBUTE_POOL: { title: string; values: string[] }[] = [
  { title: "Brand", values: ["Zenith", "Corex", "Nimbus", "Vantek", "Orbis", "Pulsar", "Kinetix", "Aurio"] },
  { title: "Material", values: ["Aluminum", "Plastic", "Carbon Fiber", "Stainless Steel", "Silicone", "Glass"] },
  { title: "Color", values: ["Black", "White", "Silver", "Space Gray", "Midnight Blue", "Rose Gold"] },
  { title: "Connectivity", values: ["Bluetooth 5.3", "Wi-Fi 6", "USB-C", "NFC", "5G", "Wired"] },
  { title: "Battery Life", values: ["Up to 8 hours", "Up to 20 hours", "Up to 30 hours", "Up to 48 hours", "Up to 10 days"] },
  { title: "Weight", values: ["120g", "250g", "480g", "1.2kg", "1.8kg", "2.4kg"] },
  { title: "Warranty", values: ["1 Year", "2 Years", "3 Years", "Limited Lifetime"] },
  { title: "Water Resistance", values: ["IPX4", "IPX7", "IP68", "Not Rated"] },
  { title: "Compatibility", values: ["iOS & Android", "Windows & macOS", "Universal", "iOS Only", "Android Only"] },
  { title: "Storage", values: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
];

// Picks `count` distinct attribute titles from ATTRIBUTE_POOL (capped by
// however many titles exist) and one random value for each.
function buildProductAttributeDrafts(count: number): { title: string; value: string }[] {
  const chosen = faker.helpers.arrayElements(ATTRIBUTE_POOL, Math.min(count, ATTRIBUTE_POOL.length));

  return chosen.map(({ title, values }) => ({
    title,
    value: faker.helpers.arrayElement(values),
  }));
}

// Phrases used to close out a product description with something that
// reads like a real selling point, without inventing category-specific
// claims (e.g. never says "long battery life" for a desktop tower).
const DESCRIPTION_SELLING_POINTS = [
  "built for everyday reliability",
  "designed with everyday performance in mind",
  "backed by a manufacturer warranty",
  "a favorite among reviewers this year",
  "engineered for long-lasting durability",
  "crafted with both style and function in mind",
];

// Builds a description that always names the product's own type and
// category, so — unlike a fully random faker.commerce.productDescription()
// — it reads as obviously about the same product as the title and image.
function buildProductDescription(productType: string, categoryName: string): string {
  const material     = faker.helpers.arrayElement(["aluminum", "premium plastic", "brushed metal", "reinforced polycarbonate", "matte-finish composite"]);
  const sellingPoint  = faker.helpers.arrayElement(DESCRIPTION_SELLING_POINTS);

  return `This ${productType.toLowerCase()} is part of our ${categoryName} lineup, featuring a durable ${material} build and ${sellingPoint}. A great pick for anyone shopping for a new ${productType.toLowerCase()}.`;
}

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
// remote DummyJSON/placehold.co URL has nothing local to clean up, so it's
// skipped.
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

  console.log("Fetching electronics product images from DummyJSON...");
  const imagePoolsByCategory = await fetchDummyJsonImagePoolsByCategory();
  for (const [categoryName, slugs] of Object.entries(CATEGORY_TO_DUMMYJSON_SLUGS)) {
    const count = imagePoolsByCategory[categoryName]?.length ?? 0;
    if (count === 0) {
      console.warn(`  DummyJSON pool for "${categoryName}" came back empty; falling back to placehold.co labels.`);
    } else {
      console.log(`  Pooled ${count} real product images for "${categoryName}" (${slugs.join(", ")}).`);
    }
  }

  // Builds the images for one product, always sourced from its OWN
  // category: a real DummyJSON photo pool when CATEGORY_TO_DUMMYJSON_SLUGS
  // has one for that category (and it came back non-empty), otherwise a
  // placehold.co image labelled with the product's own type — either way
  // the image can never belong to a different product type than the title.
  function buildProductImageUrls(categoryName: string, productType: string, imageCount: number): string[] {
    const pool = imagePoolsByCategory[categoryName] ?? [];

    if (pool.length > 0) {
      // arrayElements never repeats a URL within one call, so a product
      // never gets the same photo twice; capped at the pool size in the
      // (unlikely) case imageCount exceeds it.
      return faker.helpers.arrayElements(pool, Math.min(imageCount, pool.length));
    }

    return Array.from({length: imageCount}, (_, imageIndex) =>
      buildPlaceholderImageUrl(
        imageCount > 1 ? `${productType} ${imageIndex + 1}` : productType,
        faker.helpers.arrayElement(PLACEHOLDER_COLOR_PAIRS)
      )
    );
  }

  const usedFriendlyIds = new Set<string>();
  const productDrafts = Array.from({length: NUM_PRODUCTS}).map(() => {
    const imageCount = faker.number.int({min: MIN_IMAGES_PER_PRODUCT, max: MAX_IMAGES_PER_PRODUCT});
    const variantCount = faker.number.int({min: MIN_VARIANTS_PER_PRODUCT, max: MAX_VARIANTS_PER_PRODUCT});
    const basePrice = Number(faker.commerce.price({min: 5, max: 500}));

    // Category is picked FIRST (~85% of products get one, the rest
    // exercise the nullable FK) so the product type — and therefore the
    // name, description, and images derived from it below — always fits
    // whichever category (or lack of one) the product ends up with.
    const category = faker.datatype.boolean({probability: 0.85})
      ? faker.helpers.arrayElement(categories)
      : null;
    const categoryName = category?.name ?? faker.helpers.arrayElement(Object.keys(PRODUCT_TYPES_BY_CATEGORY));
    const productType  = faker.helpers.arrayElement(PRODUCT_TYPES_BY_CATEGORY[categoryName]);

    const name = `${faker.commerce.productAdjective()} ${productType}`;
    const baseFriendlyId = slugify(name) || "product";
    let friendlyId = baseFriendlyId;
    let suffix = 2;
    while (usedFriendlyIds.has(friendlyId)) {
      friendlyId = `${baseFriendlyId}-${suffix}`;
      suffix += 1;
    }
    usedFriendlyIds.add(friendlyId);

    return {
      name,
      friendlyId,
      description:     buildProductDescription(productType, categoryName),
      price:           basePrice,
      categoryId:      category?.id ?? null,
      remoteImageUrls: buildProductImageUrls(categoryName, productType, imageCount),
      variants:        buildProductVariantDrafts(variantCount, basePrice),
      attributes:      buildProductAttributeDrafts(
        faker.number.int({min: MIN_ATTRIBUTES_PER_PRODUCT, max: MAX_ATTRIBUTES_PER_PRODUCT})
      ),
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
        friendlyId:  draft.friendlyId,
        description: draft.description,
        price:       draft.price,
        categoryId:  draft.categoryId,
        images: {
          create: localUrlsByProduct[i].map((url, imageIndex) => ({
            url,
            isPrimary: imageIndex === 0, // first image is the primary one
          })),
        },
        attributes: {
          create: draft.attributes.map(({ title, value }) => ({
            title,
            value,
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

  const totalVariants   = productDrafts.reduce((sum, d) => sum + d.variants.length, 0);
  const totalAttributes = productDrafts.reduce((sum, d) => sum + d.attributes.length, 0);

  console.log(`Seeded ${NUM_USERS} users, ${categories.length} categories, ${NUM_PRODUCTS} products, ${totalVariants} variants, and ${totalAttributes} product attributes.`);
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