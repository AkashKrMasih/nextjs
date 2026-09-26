import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PRODUCT_REPORT_REASONS } from '@/lib/product-report-reasons';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'only logged in user can report' }, { status: 401 });
  }

  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const reason = String(formData.get('reason') ?? '');
  const message = String(formData.get('message') ?? '').trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }
  if (!PRODUCT_REPORT_REASONS.includes(reason as (typeof PRODUCT_REPORT_REASONS)[number])) {
    return NextResponse.json({ error: 'Choose a reason.' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const report = await prisma.productReport.create({
    data: { reason, message, productId, userId: session.userId },
    select: { id: true },
  });

  return NextResponse.json(report, { status: 201 });
}
