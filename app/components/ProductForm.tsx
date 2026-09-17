'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
};

export function ProductForm({
  productId,
  initial,
}: {
  productId?: number;
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(
    initial ?? {
      name: '',
      description: '',
      price: '',
      stock: '0',
      imageUrl: '',
    }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const response = await fetch(
      productId ? `/api/products/${productId}` : '/api/products',
      {
        method: productId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          price: values.price,
          stock: Number(values.stock),
          imageUrl: values.imageUrl,
        }),
      }
    );

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save product');
      return;
    }

    router.push(`/products/${payload.id}`);
    router.refresh();
  }

  function field(
    key: keyof ProductFormValues,
    props: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>
  ) {
    return {
      ...props,
      value: values[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setValues((current) => ({ ...current, [key]: e.target.value })),
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="w-full rounded border border-[#D8D2C4] bg-white p-2"
        placeholder="Product name"
        required
        {...field('name', {})}
      />
      <textarea
        className="h-32 w-full rounded border border-[#D8D2C4] bg-white p-2"
        placeholder="Description"
        {...field('description', {})}
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          className="w-full rounded border border-[#D8D2C4] bg-white p-2"
          placeholder="Price"
          type="number"
          min="0"
          step="0.01"
          required
          {...field('price', {})}
        />
        <input
          className="w-full rounded border border-[#D8D2C4] bg-white p-2"
          placeholder="Stock"
          type="number"
          min="0"
          step="1"
          required
          {...field('stock', {})}
        />
      </div>

      <input name="images" type="file" accept="image/*" multiple />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        className="rounded bg-[#55624A] px-4 py-2 text-white disabled:opacity-60"
        disabled={saving}
      >
        {saving ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
      </button>
    </form>
  );
}
