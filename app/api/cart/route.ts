import { NextRequest, NextResponse } from 'next/server';
import { readCart, addToCart, updateQuantity, removeFromCart, clearCart } from '@/lib/cart_db';

export async function GET() {
  const items = await readCart();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, name, price, quantity } = body ?? {};
  if (typeof id !== 'number' || !name || !price) {
    return NextResponse.json({ error: 'id, name, and price are required' }, { status: 400 });
  }
  const items = await addToCart({ id, name, price }, quantity ?? 1);
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, quantity } = body ?? {};
  if (typeof id !== 'number' || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'id and quantity are required' }, { status: 400 });
  }
  const items = await updateQuantity(id, quantity);
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');

  if (idParam === null) {
    const items = await clearCart();
    return NextResponse.json({ items });
  }

  const items = await removeFromCart(Number(idParam));
  return NextResponse.json({ items });
}