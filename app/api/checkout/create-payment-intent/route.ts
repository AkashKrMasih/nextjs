import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { priceCart } from '@/lib/discounts';
import {
  INVALID_PINCODE_MESSAGE,
  normalizePincode,
  validateCartDeliveryPincode,
} from '@/lib/delivery-pincodes';

type RequestBody = {
  items: { id: number; quantity: number }[];
  guestEmail?: string;
  discountCode?: string;
  postalCode?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { items, guestEmail, discountCode, postalCode } = body;

  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  if (!normalizePincode(String(postalCode ?? ''))) {
    return NextResponse.json({ error: 'Delivery postal code is required.' }, { status: 400 });
  }

  const user = await auth();

  if (!user && !guestEmail) {
    return NextResponse.json(
      { error: 'guestEmail is required for guest checkout' },
      { status: 400 },
    );
  }

  // Re-price everything from the DB. Never trust price/quantity sent by the client.
  const priced = await priceCart(
    items.map((item) => ({ id: Number(item.id), quantity: Number(item.quantity) })),
    discountCode
  );
  if ('error' in priced) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  const pincodeCheck = await validateCartDeliveryPincode(
    priced.lines.map((line) => line.productId),
    String(postalCode)
  );
  if (!pincodeCheck.ok) {
    const message = pincodeCheck.productName
      ? `${INVALID_PINCODE_MESSAGE} (${pincodeCheck.productName})`
      : INVALID_PINCODE_MESSAGE;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (priced.amountTotalCents <= 0) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
  }

  const lineItems = priced.lines.map((line) => ({
    variantId: line.variantId,
    name: line.name,
    unitPrice: line.unitPriceCents,
    quantity: line.quantity,
    discountCode: line.discountCode,
  }));
  const amountTotal = priced.amountTotalCents;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountTotal,
    currency: (process.env.CURRENCY_CODE ?? 'usd').toLowerCase(),
    receipt_email: user?.email ?? guestEmail,
    metadata: {
      userId: user?.id ?? '',
      guestEmail: user ? '' : guestEmail ?? '',
      discountCode: priced.code ?? '',
      items: JSON.stringify(lineItems),
    },
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}