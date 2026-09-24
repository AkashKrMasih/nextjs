import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/products');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type AttributeInput = { title: string; value: string };

export type VariantInput = {
  id?: string;
  sku: string;
  name: string | null;
  price: string | null;
  isDefault: boolean;
  quantity: number;
  attributes: Record<string, string>;
};

export type ImageInput = { url: string; isPrimary: boolean };

export type ParsedProductForm = {
  name: string;
  description: string;
  price: string;
  priceOnRequest: boolean;
  categoryId: number | null;
  attributes: AttributeInput[];
  variants: VariantInput[];
  existingImages: ImageInput[];
  savedImages: ImageInput[];
};

function readJson<T>(value: FormDataEntryValue | null, fallback: T): T | { error: string } {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return { error: 'Invalid form data' };
  try {
    return JSON.parse(value) as T;
  } catch {
    return { error: 'Invalid form data' };
  }
}

function isError<T>(value: T | { error: string }): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

function variantPrice(value: string | null): string | null {
  if (value == null || value === '') return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return null;
  return price.toFixed(2);
}

function variantQuantity(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function onePrimary(images: ImageInput[]) {
  if (!images.length) return images;
  const primaryIndex = images.findIndex((image) => image.isPrimary);
  const index = primaryIndex === -1 ? 0 : primaryIndex;
  return images.map((image, i) => ({ ...image, isPrimary: i === index }));
}

export async function parseProductFormData(
  formData: FormData
): Promise<ParsedProductForm | { error: string }> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Name is required' };

  const description = String(formData.get('description') ?? '').trim();
  const priceNumber = Number(formData.get('price'));
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { error: 'Price must be a number greater than or equal to 0' };
  }
  const priceOnRequest = formData.get('priceOnRequest') === 'true';

  const categoryRaw = String(formData.get('categoryId') ?? '').trim();
  const categoryId = categoryRaw ? Number(categoryRaw) : null;
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    return { error: 'Invalid category' };
  }

  const attributesResult = readJson<AttributeInput[]>(formData.get('attributes'), []);
  if (isError(attributesResult)) return attributesResult;
  const attributes = (Array.isArray(attributesResult) ? attributesResult : [])
    .map((attr) => ({
      title: typeof attr?.title === 'string' ? attr.title.trim() : '',
      value: typeof attr?.value === 'string' ? attr.value.trim() : '',
    }))
    .filter((attr) => attr.title && attr.value);

  const variantsResult = readJson<VariantInput[]>(formData.get('variants'), []);
  if (isError(variantsResult)) return variantsResult;
  const variants = (Array.isArray(variantsResult) ? variantsResult : []).map((variant) => ({
    id: typeof variant?.id === 'string' && variant.id ? variant.id : undefined,
    sku: String(variant?.sku ?? '').trim(),
    name: variant?.name ? String(variant.name).trim() : null,
    price: variant?.price == null || variant.price === '' ? null : String(variant.price),
    isDefault: Boolean(variant?.isDefault),
    quantity: Number(variant?.quantity) || 0,
    attributes:
      variant?.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)
        ? variant.attributes
        : {},
  }));

  if (variants.length === 0) return { error: 'Add at least one variant' };
  if (variants.some((variant) => !variant.sku)) return { error: 'Every variant needs a SKU.' };
  if (!variants.some((variant) => variant.isDefault)) {
    return { error: 'Pick one variant as the default.' };
  }

  const existingResult = readJson<ImageInput[]>(formData.get('existingImages'), []);
  if (isError(existingResult)) return existingResult;
  const existingImages = (Array.isArray(existingResult) ? existingResult : [])
    .filter((image) => typeof image?.url === 'string' && image.url.startsWith('/uploads/products/'))
    .map((image) => ({ url: image.url, isPrimary: image.isPrimary === true }));

  const files = formData.getAll('images');
  const primaryFlags = formData.getAll('imageIsPrimary').map((flag) => flag === 'true');
  await mkdir(UPLOAD_DIR, { recursive: true });

  const uploaded: ImageInput[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith('image/')) return { error: 'Images must be image files' };
    if (file.size > MAX_IMAGE_BYTES) return { error: 'Each image must be 5MB or smaller' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    uploaded.push({
      url: `/uploads/products/${filename}`,
      isPrimary: primaryFlags[i] === true,
    });
  }

  const images = onePrimary([...existingImages, ...uploaded]);
  const savedCount = uploaded.length;

  return {
    name,
    description,
    price: priceNumber.toFixed(2),
    priceOnRequest,
    categoryId,
    attributes,
    variants,
    existingImages: images.slice(0, images.length - savedCount),
    savedImages: images.slice(images.length - savedCount),
  };
}

function variantData(variant: VariantInput) {
  return {
    sku: variant.sku,
    name: variant.name,
    price: variantPrice(variant.price),
    attributes: variant.attributes,
    isDefault: variant.isDefault,
  };
}

export async function createProductFromForm(parsed: ParsedProductForm) {
  return prisma.product.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      price: parsed.price,
      priceOnRequest: parsed.priceOnRequest,
      categoryId: parsed.categoryId,
      images: { create: parsed.savedImages },
      attributes: { create: parsed.attributes },
      variants: {
        create: parsed.variants.map((variant) => ({
          ...variantData(variant),
          inventory: { create: { quantity: variantQuantity(variant.quantity) } },
        })),
      },
    },
    include: { images: true, variants: true, attributes: true },
  });
}

export async function updateProductFromForm(productId: number, parsed: ParsedProductForm) {
  const currentVariants = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const ownedIds = new Set(currentVariants.map((variant) => variant.id));
  if (parsed.variants.some((variant) => variant.id && !ownedIds.has(variant.id))) {
    return { error: 'Invalid variant' as const };
  }

  const keptIds = new Set(
    parsed.variants.map((variant) => variant.id).filter((id): id is string => Boolean(id))
  );
  const removedIds = currentVariants.map((variant) => variant.id).filter((id) => !keptIds.has(id));

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        priceOnRequest: parsed.priceOnRequest,
        categoryId: parsed.categoryId,
      },
    });

    await tx.productAttribute.deleteMany({ where: { productId } });
    if (parsed.attributes.length) {
      await tx.productAttribute.createMany({
        data: parsed.attributes.map((attr) => ({ ...attr, productId })),
      });
    }

    const keepUrls = parsed.existingImages.map((image) => image.url);
    await tx.productImage.deleteMany({
      where: {
        productId,
        ...(keepUrls.length ? { url: { notIn: keepUrls } } : {}),
      },
    });
    for (const image of parsed.existingImages) {
      await tx.productImage.updateMany({
        where: { productId, url: image.url },
        data: { isPrimary: image.isPrimary },
      });
    }
    if (parsed.savedImages.length) {
      await tx.productImage.createMany({
        data: parsed.savedImages.map((image) => ({ ...image, productId })),
      });
    }

    if (removedIds.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });
    }

    for (const variant of parsed.variants) {
      const quantity = variantQuantity(variant.quantity);
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: variantData(variant),
        });
        await tx.inventory.upsert({
          where: { variantId: variant.id },
          update: { quantity },
          create: { variantId: variant.id, quantity },
        });
      } else {
        await tx.productVariant.create({
          data: {
            ...variantData(variant),
            productId,
            inventory: { create: { quantity } },
          },
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where: { id: productId },
      include: { images: true, variants: true, attributes: true },
    });
  });

  return product;
}

export function isUniqueConstraint(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

export function isForeignKeyConstraint(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2003'
  );
}
