import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseProductBody } from '@/lib/products';

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = parseProductBody(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: parsed,
  });
  return NextResponse.json(product, { status: 201 });
}
