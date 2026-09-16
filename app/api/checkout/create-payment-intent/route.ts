import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma'; // ADAPT: path to your Prisma singleton
import { auth } from '@/lib/auth'; // ADAPT: your custom session helper

type RequestBody = {
  items: { id: string; quantity: number }[];
  guestEmail?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { items, guestEmail } = body;

  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const user = await auth();

  if (!user && !guestEmail) {
    return NextResponse.json(
      { error: 'guestEmail is required for guest checkout' },
      { status: 400 },
    );
  }

  // Re-price everything from the DB. Never trust price/quantity sent by the client.
  const productIds = items.map((i) => i.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more items no longer exist' }, { status: 400 });
  }

  let amountTotal = 0;
  const lineItems = items.map((item) => {
    const product = products.find((p) => p.id === item.id)!;
    if (item.quantity < 1) {
      throw new Error(`Invalid quantity for ${product.id}`);
    }
    // ADAPT: `product.price` assumed to be an Int in cents, matching
    // your cart's formatPrice/cartTotal convention.
    amountTotal += product.price * item.quantity;
    return {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
    };
  });

  if (amountTotal <= 0) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountTotal,
    currency: 'usd', // ADAPT: pull from config if you support multiple currencies
    receipt_email: user?.email ?? guestEmail,
    metadata: {
      userId: user?.id ?? '',
      guestEmail: user ? '' : guestEmail ?? '',
      items: JSON.stringify(lineItems),
    },
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}