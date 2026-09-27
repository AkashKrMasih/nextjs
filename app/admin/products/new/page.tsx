import { PageHeader } from '@/app/components/PageHeader';
import { ProductForm } from '../ProductForm';

export default function NewProductPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <PageHeader
        title="New product"
        description="Add a product to your catalog."
        backHref="/admin/products"
        backLabel="Back to products"
        variant="admin"
        className="mb-6"
      />
      <ProductForm />
    </main>
  );
}
