export type ProductOrderLimits = {
  name: string;
  minOrderQuantity: number | null;
  maxOrderQuantity: number | null;
};

export function parseOrderQuantityField(
  raw: FormDataEntryValue | null
): number | null | { error: string } {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    return { error: 'Order quantity limits must be whole numbers of at least 1.' };
  }
  return value;
}

export function parseReturnInDaysField(
  raw: FormDataEntryValue | null
): number | null | { error: string } {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1) {
    return { error: 'Return window must be a whole number of days of at least 1.' };
  }
  return value;
}

export function validateOrderQuantityLimits(
  minOrderQuantity: number | null,
  maxOrderQuantity: number | null
): string | null {
  if (
    minOrderQuantity != null &&
    maxOrderQuantity != null &&
    minOrderQuantity > maxOrderQuantity
  ) {
    return 'Minimum order quantity cannot be greater than maximum order quantity.';
  }
  return null;
}

export function minAllowedQuantity(limits: Pick<ProductOrderLimits, 'minOrderQuantity'>): number {
  return limits.minOrderQuantity ?? 1;
}

export function validateOrderQuantity(limits: ProductOrderLimits, quantity: number): string | null {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return 'Quantity must be a whole number of at least 1.';
  }
  const min = minAllowedQuantity(limits);
  if (quantity < min) {
    return `Minimum order quantity for ${limits.name} is ${min}.`;
  }
  if (limits.maxOrderQuantity != null && quantity > limits.maxOrderQuantity) {
    return `Maximum order quantity for ${limits.name} is ${limits.maxOrderQuantity}.`;
  }
  return null;
}
