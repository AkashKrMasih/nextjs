import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/money';
import { DeleteDiscountButton } from './delete-discount-button';

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight tracking-tight text-stone-900">Discounts</h1>
          <p className="mt-1 text-sm text-stone-500">
            {discounts.length} {discounts.length === 1 ? 'code' : 'codes'}
          </p>
        </div>
        <Link
          href="/admin/discounts/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          New discount
        </Link>
      </div>

      {discounts.length === 0 ? (
        <p className="mt-10 text-sm text-stone-500">No discount codes yet.</p>
      ) : (
        <div className="mt-10 overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/50">
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Code</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Discount</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Applies to</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Until</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500" />
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id} className="border-b border-stone-200 last:border-0">
                  <td className="px-3 py-3 font-medium text-stone-900">{discount.code}</td>
                  <td className="px-3 py-3 text-stone-700">
                    {discount.kind === 'PERCENT'
                      ? `${Number(discount.value)}%`
                      : formatPrice(discount.value)}
                  </td>
                  <td className="px-3 py-3 text-stone-700">
                    {discount.product?.name ?? 'All products'}
                  </td>
                  <td className="px-3 py-3 text-stone-500">
                    {discount.expiresAt.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/admin/discounts/${discount.id}`} className="mr-3 text-green-800 hover:underline">
                      Edit
                    </Link>
                    <DeleteDiscountButton id={discount.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
