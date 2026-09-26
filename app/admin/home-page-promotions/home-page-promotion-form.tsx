'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatHomePromotionImageRequirements,
  validatePromotionImageDimensions,
} from '@/lib/home-page-promotions';

type ProductOption = { id: number; name: string };

export type HomePagePromotionFormValues = {
  productId: string;
  sortOrder: string;
  imageUrl: string;
};

function readFileDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions.'));
    };
    img.src = url;
  });
}

export function HomePagePromotionForm({
  promotionId,
  products,
  initial,
}: {
  promotionId?: string;
  products: ProductOption[];
  initial?: HomePagePromotionFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<HomePagePromotionFormValues>(
    initial ?? { productId: '', sortOrder: '0', imageUrl: '' }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof HomePagePromotionFormValues>(
    key: K,
    value: HomePagePromotionFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleImageChange(file: File | null) {
    setImageFile(file);
    setError(null);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    if (!file) return;

    try {
      const { width, height } = await readFileDimensions(file);
      const dimensionError = validatePromotionImageDimensions(width, height);
      if (dimensionError) {
        setError(dimensionError);
        setImageFile(null);
        return;
      }
      setImagePreviewUrl(URL.createObjectURL(file));
    } catch {
      setError('Could not read image dimensions.');
      setImageFile(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (imageFile) {
      const { width, height } = await readFileDimensions(imageFile).catch(() => null);
      if (!width || !height) {
        setSaving(false);
        setError('Could not read image dimensions.');
        return;
      }
      const dimensionError = validatePromotionImageDimensions(width, height);
      if (dimensionError) {
        setSaving(false);
        setError(dimensionError);
        return;
      }
    }

    const formData = new FormData();
    formData.set('sortOrder', values.sortOrder);
    formData.set('productId', values.productId);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await fetch(
      promotionId ? `/api/home-page-promotions/${promotionId}` : '/api/home-page-promotions',
      { method: promotionId ? 'PUT' : 'POST', body: formData }
    );
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save promotion');
      return;
    }

    router.push('/admin/home-page-promotions');
    router.refresh();
  }

  const previewSrc = imagePreviewUrl ?? (values.imageUrl && !imageFile ? values.imageUrl : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-stone-600">
        Banner image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={!promotionId && !values.imageUrl}
          className="mt-1 block w-full text-sm"
          onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
        />
        <span className="mt-1 block text-xs text-stone-500">
          {formatHomePromotionImageRequirements()} Max 5MB.
        </span>
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Promotion preview"
            className="mt-2 max-h-40 rounded border border-stone-200 object-contain"
          />
        ) : null}
      </label>

      <label className="block text-sm text-stone-600">
        Product (optional)
        <select
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2"
          value={values.productId}
          onChange={(event) => update('productId', event.target.value)}
        >
          <option value="">No product link</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-stone-500">
          When selected, clicking the banner opens that product&apos;s page.
        </span>
      </label>

      <label className="block text-sm text-stone-600">
        Sort order
        <input
          type="number"
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2"
          value={values.sortOrder}
          onChange={(event) => update('sortOrder', event.target.value)}
        />
        <span className="mt-1 block text-xs text-stone-500">Lower numbers appear first in the carousel.</span>
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : promotionId ? 'Save changes' : 'Create promotion'}
      </button>
    </form>
  );
}
