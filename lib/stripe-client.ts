'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { getPublishableKey } from '@/app/admin/settings/stripe/actions';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = getPublishableKey().then((key) => loadStripe(key));
  }
  return stripePromise;
}