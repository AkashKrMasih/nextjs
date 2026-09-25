import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { formatPrice } from '@/lib/money';

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: { images: { orderBy: { isPrimary: 'desc' } } },
          },
        },
      },
    },
  });

  const items = wishlist?.items ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl tracking-tight text-stone-900">Wishlists</h1>
      <p className="mt-1 text-sm text-stone-500">Products you saved, newest first</p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">Your wishlist is empty.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => {
            const image = item.product.images[0]?.url;
            return (
              <li key={item.id} className="overflow-hidden rounded-lg border border-stone-300 bg-white">
                <Link href={`/products/${item.product.id}`} className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-stone-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{item.product.name}</p>
                    {item.product.priceOnRequest ? (
                      <p className="mt-1 text-sm text-green-800">Price on request</p>
                    ) : (
                      <p className="mt-1 text-sm text-green-800">{formatPrice(item.product.price)}</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
