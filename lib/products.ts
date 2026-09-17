export type ProductInput = {
  name: string;
  description: string;
  price: string;
  stock: number;
};

export function parseProductBody(body: unknown): ProductInput | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid JSON body' };
  }

  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) return { error: 'Name is required' };

  const description =
    typeof data.description === 'string' ? data.description.trim() : '';

  const rawPrice = data.price;
  const priceNumber =
    typeof rawPrice === 'number'
      ? rawPrice
      : typeof rawPrice === 'string'
        ? Number(rawPrice)
        : NaN;

  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { error: 'Price must be a number greater than or equal to 0' };
  }

  const rawStock = data.stock;
  const stock =
    typeof rawStock === 'number'
      ? rawStock
      : typeof rawStock === 'string'
        ? Number(rawStock)
        : 0;

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'Stock must be a whole number greater than or equal to 0' };
  }

  return {
    name,
    description,
    price: priceNumber.toFixed(2),
    stock,
  };
}
