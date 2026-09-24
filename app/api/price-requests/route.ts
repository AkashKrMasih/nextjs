import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const formData = await request.formData();
  const productId = Number(formData.get('productId'));
  const email = String(formData.get('email') ?? '').trim();
  const productTitle = String(formData.get('productTitle') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  if (!productTitle) {
    return NextResponse.json({ error: 'Product title is required.' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, priceOnRequest: true },
  });
  if (!product || !product.priceOnRequest) {
    return NextResponse.json({ error: 'This product does not take price requests.' }, { status: 400 });
  }

  const session = await getSession();
  const priceRequest = await prisma.priceRequest.create({
    data: {
      email,
      productTitle,
      message,
      productId,
      userId: session?.userId ?? null,
    },
    select: { id: true, email: true, productTitle: true, message: true, createdAt: true },
  });

  return NextResponse.json(priceRequest, { status: 201 });
}
