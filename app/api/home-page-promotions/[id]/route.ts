import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { parseHomePagePromotionForm } from '@/lib/home-page-promotions';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.homePagePromotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = await parseHomePagePromotionForm(await request.formData(), {
    requireImage: false,
    existingImageUrl: existing.imageUrl,
  });
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.productId) {
    const product = await prisma.product.findUnique({ where: { id: parsed.productId } });
    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 400 });
  }

  const promotion = await prisma.homePagePromotion.update({ where: { id }, data: parsed });
  return NextResponse.json(promotion);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.homePagePromotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.homePagePromotion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
