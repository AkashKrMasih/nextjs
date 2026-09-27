import { PageHeader } from '@/app/components/PageHeader';
import { prisma } from '@/lib/prisma';
import { DiscountForm } from '../discount-form';

export default async function NewDiscountPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <PageHeader
        title="New discount"
        description="Create a checkout discount code."
        backHref="/admin/discounts"
        backLabel="Back to discounts"
        variant="admin"
        className="mb-6"
      />
      <DiscountForm products={products} />
    </main>
  );
}
