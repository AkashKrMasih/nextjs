import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DiscountForm } from '../discount-form';

export default async function NewDiscountPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to discounts
      </Link>
      <h1 className="mt-4 mb-6 text-2xl tracking-tight text-stone-900">New discount</h1>
      <DiscountForm products={products} />
    </main>
  );
}
