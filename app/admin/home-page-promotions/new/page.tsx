import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { HomePagePromotionForm } from '../home-page-promotion-form';

export default async function NewHomePagePromotionPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/home-page-promotions"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to home promotions
      </Link>
      <h1 className="mt-4 mb-6 text-2xl tracking-tight text-stone-900">New home promotion</h1>
      <HomePagePromotionForm products={products} />
    </main>
  );
}
