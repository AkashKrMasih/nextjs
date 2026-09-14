import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/money';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { id: 'desc' },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} in your catalog
          </p>
        </div>

        <button
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="size-4" />
          Add product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-muted/40 py-20 text-center">
          <p className="text-sm text-muted-foreground">No products yet. Add your first one to get started.</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const inStock = product.stock > 0;
            return (
              <div
                key={product.id}
                className="group overflow-hidden rounded-[20px] border border-border bg-card transition-all hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <span
                    className={[
                      'absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium',
                      inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                    ].join(' ')}
                  >
                    {inStock ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                <div className="space-y-1 p-4">
                  <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                    {product.name}
                  </p>
                  <p className="text-sm text-foreground">{formatPrice(product.price)}</p>

                  <div className="flex gap-2 pt-3">
                    <button
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
