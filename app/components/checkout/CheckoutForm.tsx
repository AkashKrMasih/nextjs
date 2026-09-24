'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe-client';

function PaymentForm({ payerLabel }: { payerLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/cart/checkout/success`,
      },
    });

    // confirmPayment only returns if there's an immediate error (e.g. card
    // declined). On success it redirects to return_url.
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-500">Paying as {payerLabel}</p>
      <PaymentElement />
      {error && <p className="text-sm text-red-800">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded bg-green-800 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export default function CheckoutForm({
                                       clientSecret,
                                       payerLabel,
                                     }: {
  clientSecret: string;
  payerLabel: string;
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  if (!stripePromise) {
    return null; // or a lightweight skeleton/spinner while Stripe initializes
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#166534',
            colorBackground: '#ffffff',
            colorText: '#1c1917',
            borderRadius: '4px',
          },
        },
      }}
    >
      <PaymentForm payerLabel={payerLabel} />
    </Elements>
  );
}