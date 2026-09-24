import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/products');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type AttributeInput = { title: string; value: string };
type VariantInput = {
  sku: string;
  name: string | null;
  price: string | null;
  isDefault: boolean;
  quantity: number;
  attributes: Record<string, string>;
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

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: true },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const description = String(formData.get('description') ?? '').trim();
  const priceNumber = Number(formData.get('price'));
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return NextResponse.json(
      { error: 'Price must be a number greater than or equal to 0' },
      { status: 400 }
    );
  }

  const categoryRaw = String(formData.get('categoryId') ?? '').trim();
  const categoryId = categoryRaw ? Number(categoryRaw) : null;
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const attributesResult = readJson<AttributeInput[]>(formData.get('attributes'), []);
  if ('error' in attributesResult) {
    return NextResponse.json({ error: attributesResult.error }, { status: 400 });
  }
  const attributes = (Array.isArray(attributesResult) ? attributesResult : [])
    .map((attr) => ({
      title: typeof attr?.title === 'string' ? attr.title.trim() : '',
      value: typeof attr?.value === 'string' ? attr.value.trim() : '',
    }))
    .filter((attr) => attr.title && attr.value);

  const variantsResult = readJson<VariantInput[]>(formData.get('variants'), []);
  if ('error' in variantsResult) {
    return NextResponse.json({ error: variantsResult.error }, { status: 400 });
  }
  const variants = Array.isArray(variantsResult) ? variantsResult : [];
  if (variants.length === 0) {
    return NextResponse.json({ error: 'Add at least one variant' }, { status: 400 });
  }
  if (variants.some((variant) => !String(variant?.sku ?? '').trim())) {
    return NextResponse.json({ error: 'Every variant needs a SKU.' }, { status: 400 });
  }
  if (!variants.some((variant) => variant.isDefault)) {
    return NextResponse.json({ error: 'Pick one variant as the default.' }, { status: 400 });
  }

  const files = formData.getAll('images');
  const primaryFlags = formData.getAll('imageIsPrimary').map((flag) => flag === 'true');

  await mkdir(UPLOAD_DIR, { recursive: true });

  const savedImages: { url: string; isPrimary: boolean }[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Images must be image files' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Each image must be 5MB or smaller' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    savedImages.push({
      url: `/uploads/products/${filename}`,
      isPrimary: primaryFlags[i] === true,
    });
  }

  if (savedImages.length && !savedImages.some((image) => image.isPrimary)) {
    savedImages[0].isPrimary = true;
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: priceNumber.toFixed(2),
        categoryId,
        images: {
          create: savedImages,
        },
        attributes: {
          create: attributes,
        },
        variants: {
          create: variants.map((variant) => {
            const override = variant.price == null || variant.price === '' ? null : Number(variant.price);
            const quantity = Number(variant.quantity);
            return {
              sku: String(variant.sku).trim(),
              name: variant.name ? String(variant.name).trim() : null,
              price:
                override == null || !Number.isFinite(override) ? null : override.toFixed(2),
              attributes: variant.attributes ?? {},
              isDefault: Boolean(variant.isDefault),
              inventory: {
                create: {
                  quantity: Number.isInteger(quantity) && quantity >= 0 ? quantity : 0,
                },
              },
            };
          }),
        },
      },
      include: { images: true, variants: true, attributes: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'A variant SKU already exists' }, { status: 400 });
    }
    throw error;
  }
}
