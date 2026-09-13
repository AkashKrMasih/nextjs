import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseProductBody } from '@/lib/products';

function productId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = productId(id);
  if (!numericId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: numericId } });
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = productId(id);
  if (!numericId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = parseProductBody(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: numericId },
    data: parsed,
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = productId(id);
  if (!numericId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: numericId } });
  return NextResponse.json({ success: true });
}
