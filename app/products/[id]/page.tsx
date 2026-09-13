import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/money';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { DeleteProductButton } from '@/app/components/DeleteProductButton';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
  });

  if (!product) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-[#8A8375] hover:text-[#55624A]">
        ← Catalog
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-[#EFEBE3]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#8A8375]">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl leading-snug tracking-tight">{product.name}</h1>
          <p className="mt-3 text-xl text-[#55624A]">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm text-[#8A8375]">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          {product.description ? (
            <p className="mt-6 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price.toString()}
              disabled={product.stock < 1}
            />
            <Link
              href={`/products/${product.id}/edit`}
              className="rounded border border-[#D8D2C4] px-4 py-2"
            >
              Edit
            </Link>
            <DeleteProductButton id={product.id} name={product.name} />
          </div>
        </div>
      </div>
    </main>
  );
}
