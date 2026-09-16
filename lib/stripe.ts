import Stripe from 'stripe';
import {getSecretKey} from "@/app/admin/settings/stripe/actions";

const key = await getSecretKey();

if (!key) {
  throw new Error('Missing STRIPE_SECRET_KEY please set it through admin panel');
}

// ADAPT: bump apiVersion to whatever the installed `stripe` package expects
// (it will tell you at build time if this string is stale).
export const stripe = new Stripe(key, {
  apiVersion: '2024-06-20',
  typescript: true,
});