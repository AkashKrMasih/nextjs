'use client';

import {loadStripe, type Stripe} from '@stripe/stripe-js';
import {getPublishableKey} from "@/app/admin/settings/stripe/actions";

let stripePromise: Promise<Stripe | null>;

export async function getStripe() {
  if (!stripePromise) {
    const key     = await getPublishableKey();
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}