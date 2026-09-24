import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { ProductForm } from '../../ProductForm';
import type { ProductFormValues } from '../../types';

function variantOptions(variantId: string, attributes: unknown) {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return [];
  }
  return Object.entries(attributes).map(([name, value]) => ({
    key: `${variantId}-${name}`,
    name,
    value: value == null ? '' : String(value),
  }));
}

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
    include: {
      images: { orderBy: { isPrimary: 'desc' } },
      attributes: { orderBy: { title: 'asc' } },
      variants: { include: { inventory: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!product) {
    notFound();
  }

  const initial: ProductFormValues = {
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    categoryId: product.categoryId ? String(product.categoryId) : '',
    images: product.images.map((image) => ({
      key: image.id,
      file: null,
      url: image.url,
      isPrimary: image.isPrimary,
    })),
    attributes: product.attributes.map((attribute) => ({
      key: attribute.id,
      title: attribute.title,
      value: attribute.value ?? '',
    })),
    variants: product.variants.length
      ? product.variants.map((variant) => ({
          key: variant.id,
          id: variant.id,
          sku: variant.sku,
          name: variant.name ?? '',
          price: variant.price ? variant.price.toString() : '',
          quantity: String(variant.inventory?.quantity ?? 0),
          isDefault: variant.isDefault,
          attributes: variantOptions(variant.id, variant.attributes),
        }))
      : [
          {
            key: 'default',
            sku: '',
            name: '',
            price: '',
            quantity: '0',
            isDefault: true,
            attributes: [],
          },
        ],
  };

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

      <div className="mt-8">
        <ProductForm productId={product.id} initial={initial} />
      </div>
    </main>
  );
}
