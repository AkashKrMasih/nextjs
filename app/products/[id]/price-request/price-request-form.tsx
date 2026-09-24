'use client';

import { useState } from 'react';

export function PriceRequestForm({
  productId,
  productTitle,
  email,
}: {
  productId: number;
  productTitle: string;
  email: string;
}) {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const response = await fetch('/api/price-requests', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not send your request');
      return;
    }

    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-stone-700">Your price request was sent.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <input type="hidden" name="productId" value={productId} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email}
          className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="productTitle" className="block text-sm font-medium text-stone-900">
          Product title
        </label>
        <input
          id="productTitle"
          name="productTitle"
          type="text"
          required
          defaultValue={productTitle}
          className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-900">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Sending...' : 'Send request'}
      </button>
    </form>
  );
}
