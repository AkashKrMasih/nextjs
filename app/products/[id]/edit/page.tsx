import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductForm } from '@/app/components/ProductForm';

export default async function EditProductPage({
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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/products/${product.id}`}
        className="text-sm text-[#8A8375] hover:text-[#55624A]"
      >
        ← {product.name}
      </Link>
      <h1 className="mt-6 mb-6 text-2xl tracking-tight">Edit product</h1>
      <ProductForm
        productId={product.id}
        initial={{
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          stock: String(product.stock),
          imageUrl: product.imageUrl ?? '',
        }}
      />
    </main>
  );
}
