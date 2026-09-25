'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ProductOption = { id: number; name: string };

export type DiscountFormValues = {
  code: string;
  kind: 'PERCENT' | 'AMOUNT';
  value: string;
  productId: string;
  expiresAt: string;
};

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function DiscountForm({
  discountId,
  products,
  initial,
}: {
  discountId?: string;
  products: ProductOption[];
  initial?: DiscountFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<DiscountFormValues>(
    initial ?? { code: '', kind: 'PERCENT', value: '', productId: '', expiresAt: '' }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof DiscountFormValues>(key: K, value: DiscountFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set('code', values.code);
    formData.set('kind', values.kind);
    formData.set('value', values.value);
    formData.set('productId', values.productId);
    formData.set('expiresAt', values.expiresAt ? new Date(values.expiresAt).toISOString() : '');

    const response = await fetch(discountId ? `/api/discounts/${discountId}` : '/api/discounts', {
      method: discountId ? 'PUT' : 'POST',
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save discount');
      return;
    }

    router.push('/admin/discounts');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          className="w-full rounded border border-stone-300 bg-white p-2 uppercase"
          placeholder="Code"
          required
          value={values.code}
          onChange={(event) => update('code', event.target.value.toUpperCase())}
        />
        <button
          type="button"
          onClick={() => update('code', randomCode())}
          className="shrink-0 rounded border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          Generate
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <select
          className="rounded border border-stone-300 bg-white p-2"
          value={values.kind}
          onChange={(event) => update('kind', event.target.value as DiscountFormValues['kind'])}
        >
          <option value="PERCENT">Percent</option>
          <option value="AMOUNT">Exact amount</option>
        </select>
        <input
          className="rounded border border-stone-300 bg-white p-2"
          type="number"
          min="0.01"
          max={values.kind === 'PERCENT' ? '100' : undefined}
          step="0.01"
          required
          placeholder={values.kind === 'PERCENT' ? 'Percent off' : 'Amount off each item'}
          value={values.value}
          onChange={(event) => update('value', event.target.value)}
        />
      </div>
      <p className="text-xs text-stone-500">
        {values.kind === 'PERCENT'
          ? 'Percent is taken off each eligible item.'
          : 'The exact amount is taken off each eligible item.'}
      </p>

      <select
        className="w-full rounded border border-stone-300 bg-white p-2"
        value={values.productId}
        onChange={(event) => update('productId', event.target.value)}
      >
        <option value="">All products</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>

      <label className="block text-sm text-stone-500">
        Valid until
        <input
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-stone-900"
          type="datetime-local"
          required
          value={values.expiresAt}
          onChange={(event) => update('expiresAt', event.target.value)}
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : discountId ? 'Save discount' : 'Create discount'}
      </button>
    </form>
  );
}
