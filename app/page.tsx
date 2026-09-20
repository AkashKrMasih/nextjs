import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/money';
import Link from 'next/link';

export default async function Home() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">

      {products.length === 0 ? (
        <p className="text-sm text-[#8A8375]">
          No products yet.{' '}
          <Link href="/products/new" className="text-[#55624A] underline">
            Create the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="block overflow-hidden rounded-lg border border-[#D8D2C4] bg-white hover:border-[#55624A]"
              >
                <div className="aspect-[4/3] bg-[#EFEBE3]">
                  {product.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#8A8375]">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg leading-snug">{product.name}</h2>
                  <p className="mt-1 text-sm text-[#55624A]">
                    {formatPrice(product.price)}
                  </p>
                  <p className="mt-1 text-xs text-[#8A8375]">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}