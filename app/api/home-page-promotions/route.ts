import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { parseHomePagePromotionForm } from '@/lib/home-page-promotions';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  const promotions = await prisma.homePagePromotion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { product: { select: { id: true, name: true, friendlyId: true } } },
  });
  return NextResponse.json(promotions);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = await parseHomePagePromotionForm(await request.formData(), { requireImage: true });
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.productId) {
    const product = await prisma.product.findUnique({ where: { id: parsed.productId } });
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 400 });
  }

  const promotion = await prisma.homePagePromotion.create({ data: parsed });
  return NextResponse.json(promotion, { status: 201 });
}
