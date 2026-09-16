// lib/money.ts
import {DEFAULT_CURRENCY, getCurrencyCode} from "@/app/admin/settings/currency/actions";

// Synchronous formatter — takes currency as a parameter, no top-level await
export function formatPrice(
  value: { toString(): string } | string | number,
  currencyCode: string = DEFAULT_CURRENCY.code
) {
  const amount = Number(value.toString());
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

// Async helper for places that need to fetch it fresh (server components, actions)
export async function getFormattedPrice(value: { toString(): string } | string | number) {
  const code = await getCurrencyCode();
  return formatPrice(value, code);
}