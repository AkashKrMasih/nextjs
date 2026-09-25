import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DiscountForm } from '../discount-form';

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [discount, products] = await Promise.all([
    prisma.discount.findUnique({ where: { id } }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);
  if (!discount) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to discounts
      </Link>
      <h1 className="mt-4 mb-6 text-2xl tracking-tight text-stone-900">Edit discount</h1>
      <DiscountForm
        discountId={discount.id}
        products={products}
        initial={{
          code: discount.code,
          kind: discount.kind,
          value: Number(discount.value).toString(),
          productId: discount.productId ? String(discount.productId) : '',
          expiresAt: toLocalInput(discount.expiresAt),
        }}
      />
    </main>
  );
}
