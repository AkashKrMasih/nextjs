import { NextResponse } from 'next/server';
import { priceCart } from '@/lib/discounts';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    code?: string;
    items?: { id: number; quantity: number }[];
  } | null;

  const priced = await priceCart(body?.items ?? [], body?.code);
  if ('error' in priced) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }
  return NextResponse.json(priced);
}
