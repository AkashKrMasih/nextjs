export function formatPrice(value: { toString(): string } | string | number) {
  const amount = Number(value.toString());
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
