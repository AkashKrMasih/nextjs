import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  normalizeDiscountCode,
  type CartLineInput,
  type PricedCart,
  type PricedLine,
  type ProductDiscountOffer,
} from '@/lib/discounts';

function cents(value: { toString(): string } | number) {
  return Math.round(Number(value.toString()) * 100);
}

export async function priceCart(
  items: CartLineInput[],
  rawCode?: string | null
): Promise<PricedCart | { error: string }> {
  if (!items.length) return { error: 'Cart is empty' };
  if (items.some((item) => !Number.isInteger(item.id) || item.id <= 0 || item.quantity < 1)) {
    return { error: 'Invalid cart item' };
  }

  const productIds = [...new Set(items.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] } },
  });
  if (products.length !== productIds.length) {
    return { error: 'One or more items no longer exist' };
  }

  const code = rawCode?.trim() ? normalizeDiscountCode(rawCode) : null;
  const discount = code
    ? await prisma.discount.findUnique({
        where: { code },
        include: { product: { select: { name: true } } },
      })
    : null;

  if (code && !discount) return { error: 'Discount code not found.' };
  if (discount && discount.expiresAt.getTime() < Date.now()) {
    return { error: 'This discount code has expired.' };
  }

  const lines: PricedLine[] = items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id)!;
      const variant = product.variants[0];
      if (!variant) return null;
      const originalUnitPriceCents = cents(variant.price ?? product.price);
      const eligible =
        Boolean(discount) && (discount!.productId == null || discount!.productId === product.id);
      let unitPriceCents = originalUnitPriceCents;
      if (eligible && discount!.kind === 'PERCENT') {
        const percent = Number(discount!.value);
        unitPriceCents = Math.max(0, Math.round((originalUnitPriceCents * (100 - percent)) / 100));
      } else if (eligible && discount!.kind === 'AMOUNT') {
        unitPriceCents = Math.max(0, originalUnitPriceCents - cents(discount!.value));
      }
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        quantity: item.quantity,
        originalUnitPriceCents,
        unitPriceCents,
        discountCode: eligible && unitPriceCents < originalUnitPriceCents ? discount!.code : null,
      };
    })
    .filter((line): line is PricedLine => line !== null);

  if (lines.length !== items.length) {
    return { error: 'One or more items have no purchasable variant' };
  }

  if (discount && lines.every((line) => line.discountCode == null)) {
    return { error: 'This code does not apply to the items in your cart.' };
  }

  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.originalUnitPriceCents * line.quantity,
    0
  );
  const amountTotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );

  return {
    code: discount?.code ?? null,
    kind: discount?.kind ?? null,
    value: discount ? discount.value.toString() : null,
    appliesTo: discount?.product?.name ?? (discount ? 'All products' : ''),
    lines,
    subtotalCents,
    discountCents: subtotalCents - amountTotalCents,
    amountTotalCents,
  };
}

export async function getActiveDiscountsForProduct(
  productId: number
): Promise<ProductDiscountOffer[]> {
  const rows = await prisma.discount.findMany({
    where: {
      expiresAt: { gt: new Date() },
      OR: [{ productId: null }, { productId }],
    },
    orderBy: [{ productId: 'asc' }, { expiresAt: 'asc' }],
    select: { code: true, kind: true, value: true, productId: true },
  });

  return rows.map((row) => ({
    code: row.code,
    kind: row.kind,
    value: row.value.toString(),
    scope: row.productId == null ? 'all' : 'product',
  }));
}
