import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseProductBody } from '@/lib/products';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/products');

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: true },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = parseProductBody({
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: formData.get('price') as string,
  });

  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const files = formData.getAll('images') as File[];
  await mkdir(UPLOAD_DIR, { recursive: true });

  const savedUrls: string[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (!file.type.startsWith('image/')) continue;
    if (file.size > 5 * 1024 * 1024) continue; // 5MB cap

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    savedUrls.push(`/uploads/products/${filename}`);
  }

  const product = await prisma.product.create({
    data: {
      ...parsed,
      images: { create: savedUrls.map((url) => ({ url })) },
    },
    include: { images: true },
  });

  return NextResponse.json(product, { status: 201 });
}


