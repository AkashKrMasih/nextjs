import Link from 'next/link';
import { ProductForm } from '@/app/components/ProductForm';

export default function NewProductPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-[#8A8375] hover:text-[#55624A]">
        ← Catalog
      </Link>
      <h1 className="mt-6 mb-6 text-2xl tracking-tight">New product</h1>
      <ProductForm />
    </main>
  );
}
