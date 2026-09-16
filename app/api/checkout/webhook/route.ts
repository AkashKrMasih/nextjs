import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma'; // ADAPT: path to your Prisma singleton

// Webhooks need the raw body for signature verification, so don't add any
// body-parsing middleware in front of this route.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Idempotency: skip if we already recorded this PaymentIntent.
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const userId = pi.metadata.userId || null;
    const guestEmail = pi.metadata.guestEmail || null;
    const items = JSON.parse(pi.metadata.items || '[]') as {
      productId: string;
      name: string;
      unitPrice: number;
      quantity: number;
    }[];

    await prisma.order.create({
      data: {
        userId,
        guestEmail,
        status: 'PAID',
        amountTotal: pi.amount,
        currency: pi.currency,
        stripePaymentIntentId: pi.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    // ADAPT: optionally log/alert here. No Order row is created for failed intents
    // above, so there's nothing to mark FAILED unless you pre-create orders as PENDING.
    console.error('Payment failed', pi.id, pi.last_payment_error?.message);
  }

  return NextResponse.json({ received: true });
}