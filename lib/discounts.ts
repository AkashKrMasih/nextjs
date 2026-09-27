export type CartLineInput = { id: number; quantity: number };

export type PricedLine = {
  productId: number;
  variantId: string;
  name: string;
  quantity: number;
  originalUnitPriceCents: number;
  unitPriceCents: number;
  discountCode: string | null;
};

export type PricedCart = {
  code: string | null;
  kind: 'PERCENT' | 'AMOUNT' | null;
  value: string | null;
  appliesTo: string;
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  amountTotalCents: number;
};

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
}

export const CHECKOUT_DISCOUNT_STORAGE_KEY = 'checkoutDiscountCode';

export type ProductDiscountOffer = {
  code: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: string;
  scope: 'all' | 'product';
};

export function formatDiscountOfferLabel(
  offer: Pick<ProductDiscountOffer, 'kind' | 'value'>,
  formatAmount?: (amount: number | string) => string
) {
  if (offer.kind === 'PERCENT') {
    return `${Number(offer.value)}% off`;
  }
  const amount = formatAmount ? formatAmount(offer.value) : Number(offer.value).toFixed(2);
  return `${amount} off`;
}

export function parseDiscountForm(formData: FormData) {
  const code = normalizeDiscountCode(String(formData.get('code') ?? ''));
  const kind = String(formData.get('kind') ?? '');
  const value = Number(formData.get('value'));
  const productRaw = String(formData.get('productId') ?? '').trim();
  const expiresRaw = String(formData.get('expiresAt') ?? '').trim();

  if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
    return { error: 'Code must be 3–32 letters, numbers, or hyphens.' };
  }
  if (kind !== 'PERCENT' && kind !== 'AMOUNT') {
    return { error: 'Choose a percent or an exact amount.' };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { error: 'Value must be greater than 0.' };
  }
  if (kind === 'PERCENT' && value > 100) {
    return { error: 'Percent cannot be more than 100.' };
  }

  const productId = productRaw ? Number(productRaw) : null;
  if (productId !== null && (!Number.isInteger(productId) || productId <= 0)) {
    return { error: 'Invalid product.' };
  }

  const expiresAt = new Date(expiresRaw);
  if (!expiresRaw || Number.isNaN(expiresAt.getTime())) {
    return { error: 'Choose an expiry date and time.' };
  }
  if (expiresAt.getTime() <= Date.now()) {
    return { error: 'Expiry must be in the future.' };
  }

  return {
    code,
    kind: kind as 'PERCENT' | 'AMOUNT',
    value: value.toFixed(2),
    productId,
    expiresAt,
  };
}
