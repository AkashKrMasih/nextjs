import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { parseDiscountForm } from '@/lib/discounts';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true } } },
  });
  return NextResponse.json(discounts);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = parseDiscountForm(await request.formData());
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.productId) {
    const product = await prisma.product.findUnique({ where: { id: parsed.productId } });
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 400 });
  }

  try {
    const discount = await prisma.discount.create({ data: parsed });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'That code is already in use.' }, { status: 400 });
    }
    throw error;
  }
}
