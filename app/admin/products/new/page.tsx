import Link from 'next/link';
import { ProductForm } from '../ProductForm';

export default function NewProductPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-green-800">
        ← Catalog
      </Link>
      <h1 className="mt-6 mb-6 text-2xl tracking-tight">New product</h1>
      <ProductForm />
    </main>
  );
}
