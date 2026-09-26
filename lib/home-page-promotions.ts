import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { readImageDimensions } from '@/lib/image-dimensions';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/home-promotions');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Carousel banners: 3:1 aspect ratio (matches home page `aspect-[3/1]`). */
export const HOME_PROMOTION_IMAGE_SPECS = {
  width: 1920,
  height: 640,
  aspectRatio: 3,
  aspectTolerance: 0.02,
  minWidth: 1200,
  minHeight: 400,
  maxWidth: 3840,
  maxHeight: 1280,
} as const;

export function formatHomePromotionImageRequirements() {
  const { width, height, minWidth, minHeight, maxWidth, maxHeight } = HOME_PROMOTION_IMAGE_SPECS;
  return `${width}×${height}px recommended (3:1). Accepted: ${minWidth}–${maxWidth}px wide, ${minHeight}–${maxHeight}px tall, 3:1 aspect ratio.`;
}

export type ParsedHomePagePromotionForm = {
  imageUrl: string;
  linkUrl: null;
  productId: number | null;
  sortOrder: number;
};

export function promotionHref(promotion: {
  product?: { friendlyId: string } | null;
}): string | null {
  if (promotion.product?.friendlyId) {
    return `/products/${promotion.product.friendlyId}`;
  }
  return null;
}

export function validatePromotionImageDimensions(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'Could not read image dimensions.';
  }

  const {
    aspectRatio,
    aspectTolerance,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  } = HOME_PROMOTION_IMAGE_SPECS;

  if (width < minWidth || width > maxWidth) {
    return `Image width must be between ${minWidth}px and ${maxWidth}px (got ${width}px).`;
  }
  if (height < minHeight || height > maxHeight) {
    return `Image height must be between ${minHeight}px and ${maxHeight}px (got ${height}px).`;
  }

  const ratio = width / height;
  const low = aspectRatio * (1 - aspectTolerance);
  const high = aspectRatio * (1 + aspectTolerance);
  if (ratio < low || ratio > high) {
    return `Image must use a 3:1 aspect ratio (e.g. ${HOME_PROMOTION_IMAGE_SPECS.width}×${HOME_PROMOTION_IMAGE_SPECS.height}px). Got ${width}×${height}px.`;
  }

  return null;
}

export async function savePromotionImage(file: File): Promise<string | { error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Image is required.' };
  }
  if (!file.type.startsWith('image/')) {
    return { error: 'Image must be an image file.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'Image must be 5MB or smaller.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = readImageDimensions(buffer);
  if ('error' in dimensions) return dimensions;

  const dimensionError = validatePromotionImageDimensions(dimensions.width, dimensions.height);
  if (dimensionError) return { error: dimensionError };

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/home-promotions/${filename}`;
}

export async function parseHomePagePromotionForm(
  formData: FormData,
  options: { requireImage: boolean; existingImageUrl?: string }
): Promise<ParsedHomePagePromotionForm | { error: string }> {
  const productRaw = String(formData.get('productId') ?? '').trim();
  const sortOrderRaw = String(formData.get('sortOrder') ?? '0').trim();

  const productId = productRaw ? Number(productRaw) : null;
  if (productRaw && (!Number.isInteger(productId) || productId! <= 0)) {
    return { error: 'Invalid product.' };
  }

  const sortOrder = Number(sortOrderRaw);
  if (!Number.isInteger(sortOrder)) {
    return { error: 'Sort order must be a whole number.' };
  }

  const file = formData.get('image');
  let imageUrl = options.existingImageUrl ?? '';

  if (file instanceof File && file.size > 0) {
    const saved = await savePromotionImage(file);
    if (typeof saved === 'object' && 'error' in saved) return saved;
    imageUrl = saved;
  }

  if (!imageUrl) {
    return { error: 'Image is required.' };
  }

  return {
    imageUrl,
    linkUrl: null,
    productId,
    sortOrder,
  };
}
