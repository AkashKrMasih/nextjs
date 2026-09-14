'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProduct(id: number, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const priceInput = String(formData.get('price') ?? '');
  const stockInput = String(formData.get('stock') ?? '');
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();

  if (!name) {
    throw new Error('Name is required.');
  }

  const priceDollars = Number(priceInput);
  const stock = Number(stockInput);

  if (!Number.isFinite(priceDollars) || priceDollars < 0) {
    throw new Error('Price must be a valid non-negative number.');
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('Stock must be a valid non-negative whole number.');
  }

  // Assumes price is stored in cents (matches formatPrice-style money
  // helpers). If your schema stores price as dollars/decimal instead,
  // change this line to: const price = priceDollars;
  const price = Math.round(priceDollars * 100);

  await prisma.product.update({
    where: { id },
    data: {
      name,
      price,
      stock,
      imageUrl: imageUrl || null,
    },
  });

  // Revalidates the list page so it shows fresh data after we navigate back.
  revalidatePath('/admin/products');
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
}
