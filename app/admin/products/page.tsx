import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/money';
import { DeleteProductButton } from './delete-product-button';

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
        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-16 border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  #
                </th>
                <th className="w-16 border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Image
                </th>
                <th className="border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="w-32 border-r border-border/60 px-3 py-2.5 text-right font-medium text-muted-foreground">
                  Price
                </th>
                <th className="w-36 border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Stock
                </th>
                <th className="w-28 px-3 py-2.5 text-center font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody>
              {products.map((product, i) => {
                const inStock = product.stock > 0;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border/60 last:border-b-0 even:bg-muted/20 hover:bg-muted/40"
                  >
                    <td className="border-r border-border/60 px-3 py-2 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2">
                      <div className="flex size-9 items-center justify-center overflow-hidden rounded bg-muted">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="border-r border-border/60 px-3 py-2 text-foreground">
                      {product.name}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2 text-right tabular-nums text-foreground">
                      {formatPrice(product.price)}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2">
                        <span
                          className={[
                            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                            inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                          ].join(' ')}
                        >
                          {inStock ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          aria-label="Edit product"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}