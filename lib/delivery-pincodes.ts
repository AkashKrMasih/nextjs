import { prisma } from '@/lib/prisma';

export const INVALID_PINCODE_MESSAGE = 'Not valid pincode for this product';

export function normalizePincode(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase();
}

export function parsePincodeList(input: string): string[] {
  const parts = input.split(/[,;\n]+/);
  const codes = new Set<string>();
  for (const part of parts) {
    const code = normalizePincode(part);
    if (code) codes.add(code);
  }
  return [...codes];
}

export async function getAllowedPincodesForProduct(productId: number): Promise<string[] | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      pincodeTemplateId: true,
      pincodeTemplate: { select: { entries: { select: { code: true } } } },
      deliveryPincodes: { select: { code: true } },
    },
  });
  if (!product) return null;

  if (product.pincodeTemplateId && product.pincodeTemplate) {
    const codes = product.pincodeTemplate.entries.map((entry) => entry.code);
    return codes.length > 0 ? codes : null;
  }

  if (product.deliveryPincodes.length > 0) {
    return product.deliveryPincodes.map((entry) => entry.code);
  }

  return null;
}

export function pincodeIsAllowed(allowed: string[] | null, postalCode: string): boolean {
  if (!allowed || allowed.length === 0) return true;
  const normalized = normalizePincode(postalCode);
  if (!normalized) return false;
  const allowedSet = new Set(allowed.map(normalizePincode));
  return allowedSet.has(normalized);
}

export async function validateCartDeliveryPincode(
  productIds: number[],
  postalCode: string
): Promise<{ ok: true } | { ok: false; productName: string }> {
  const normalizedPostal = normalizePincode(postalCode);
  if (!normalizedPostal) {
    return { ok: false, productName: '' };
  }

  const uniqueIds = [...new Set(productIds)];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, name: true },
  });

  for (const product of products) {
    const allowed = await getAllowedPincodesForProduct(product.id);
    if (!pincodeIsAllowed(allowed, normalizedPostal)) {
      return { ok: false, productName: product.name };
    }
  }

  return { ok: true };
}

export async function productHasPincodeRestriction(productId: number): Promise<boolean> {
  const allowed = await getAllowedPincodesForProduct(productId);
  return Boolean(allowed && allowed.length > 0);
}
