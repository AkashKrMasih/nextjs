import { NextResponse } from 'next/server';
import { getActiveDiscountsForProduct } from '@/app/api/discounts/service';

export async function GET(request: Request) {
  const productIdRaw = new URL(request.url).searchParams.get('productId');
  const productId = productIdRaw ? Number(productIdRaw) : NaN;

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const offers = await getActiveDiscountsForProduct(productId);
  return NextResponse.json({ offers });
}
