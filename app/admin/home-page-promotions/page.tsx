import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { promotionHref } from '@/lib/home-page-promotions';
import { DeletePromotionButton } from './delete-promotion-button';

export default async function AdminHomePagePromotionsPage() {
  const promotions = await prisma.homePagePromotion.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { product: { select: { name: true, friendlyId: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight tracking-tight text-stone-900">Home promotions</h1>
          <p className="mt-1 text-sm text-stone-500">
            {promotions.length} {promotions.length === 1 ? 'slide' : 'slides'} on the home page carousel
          </p>
        </div>
        <Link
          href="/admin/home-page-promotions/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          New promotion
        </Link>
      </div>

      {promotions.length === 0 ? (
        <p className="mt-10 text-sm text-stone-500">No promotions yet.</p>
      ) : (
        <div className="mt-10 overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/50">
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Image</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500">Order</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-500" />
              </tr>
            </thead>
            <tbody>
              {promotions.map((promotion) => {
                const href = promotionHref(promotion);
                return (
                  <tr key={promotion.id} className="border-b border-stone-200 last:border-0">
                    <td className="px-3 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promotion.imageUrl}
                        alt=""
                        className="h-14 w-24 rounded object-cover"
                      />
                    </td>
                    <td className="px-3 py-3 text-stone-700">
                      {promotion.product?.name ?? '—'}
                      {href ? (
                        <span className="mt-0.5 block text-xs text-stone-500">{href}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-stone-500">{promotion.sortOrder}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/home-page-promotions/${promotion.id}`}
                        className="mr-3 text-green-800 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeletePromotionButton id={promotion.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
