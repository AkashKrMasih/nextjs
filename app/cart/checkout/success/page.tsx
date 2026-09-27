'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/PageHeader';
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
      {status === 'checking' && (
        <PageHeader
          title="Confirming payment"
          description="Please wait while we verify your payment…"
          variant="store"
        />
      )}

      {status === 'succeeded' && (
        <PageHeader
          title="Thank you"
          description="Your order is confirmed."
          variant="store"
        />
      )}

      {status === 'processing' && (
        <PageHeader
          title="Payment processing"
          description="We'll email you once it clears — no need to try again."
          variant="store"
        />
      )}

      {status === 'failed' && (
        <PageHeader
          title="Payment didn't go through"
          description={
            <>
              <Link href="/cart/checkout" className="font-medium text-green-800 underline">
                Return to checkout
              </Link>{' '}
              to try again.
            </>
          }
          variant="store"
        />
      )}
    </main>
  );
}