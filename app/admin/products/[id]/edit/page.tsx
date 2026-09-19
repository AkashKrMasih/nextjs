import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { EditProductForm } from './edit-product-form';

export default async function EditProductPage({
                                                params,
                                              }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-tight tracking-tight text-foreground">
            Edit product
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the details for {product.name}.
          </p>
        </div>

        <Link
          href={`/admin/products/${productId}/variants`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Layers className="size-4" />
          Manage variants
        </Link>
      </div>

      <EditProductForm product={product} />
    </main>
  );
}