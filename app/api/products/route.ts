import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createProductFromForm,
  isUniqueConstraint,
  parseProductFormData,
} from '@/lib/product-form';

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: true },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = await parseProductFormData(formData);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await createProductFromForm(parsed);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      return NextResponse.json({ error: 'A variant SKU already exists' }, { status: 400 });
    }
    throw error;
  }
}
