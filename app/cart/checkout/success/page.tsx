'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStripe } from '@/lib/stripe-client';
import { clearCart } from '@/lib/cart';

type Status = 'checking' | 'succeeded' | 'processing' | 'failed';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    if (!clientSecret) {
      setStatus('failed');
      return;
    }

    (async () => {
      const stripe = await getStripe();
      if (!stripe) return;
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      switch (paymentIntent?.status) {
        case 'succeeded':
          clearCart();
          setStatus('succeeded');
          break;
        case 'processing':
          setStatus('processing');
          break;
        default:
          setStatus('failed');
      }
    })();
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {status === 'checking' && <p className="text-sm text-stone-500">Confirming payment…</p>}

      {status === 'succeeded' && (
        <>
          <h1 className="text-3xl tracking-tight">Thank you</h1>
          <p className="mt-2 text-sm text-stone-500">Your order is confirmed.</p>
        </>
      )}

      {status === 'processing' && (
        <>
          <h1 className="text-3xl tracking-tight">Payment processing</h1>
          <p className="mt-2 text-sm text-stone-500">
            We'll email you once it clears — no need to try again.
          </p>
        </>
      )}

      {status === 'failed' && (
        <>
          <h1 className="text-3xl tracking-tight">Payment didn't go through</h1>
          <p className="mt-2 text-sm text-stone-500">
            <Link href="/cart/checkout" className="text-green-800 underline">
              Return to checkout
            </Link>{' '}
            to try again.
          </p>
        </>
      )}
    </main>
  );
}