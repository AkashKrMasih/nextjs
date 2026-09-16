import {getCurrencySymbol, getCurrencyCode} from "@/app/admin/settings/currency/actions";

const symbol = await getCurrencySymbol(); // "₹" or "$" if unset
const code   = await getCurrencyCode();     // "INR" or "USD" if unset

export function formatPrice(value: { toString(): string } | string | number) {
  const amount = Number(value.toString());
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency: code,
  }).format(amount);
}
