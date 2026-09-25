'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type PriceRequestRow = {
  id: string;
  email: string;
  productTitle: string;
  message: string;
  productId: number;
  friendlyId: string;
  userName: string | null;
  createdAt: string;
};

export function PriceRequestList({ requests }: { requests: PriceRequestRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(requests);
  const [selected, setSelected] = useState<PriceRequestRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  async function handleDelete() {
    if (!selected || deleting) return;
    const confirmed = window.confirm('Delete this price request?');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    const response = await fetch(`/api/price-requests/${selected.id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not delete this request');
      return;
    }

    setItems((current) => current.filter((request) => request.id !== selected.id));
    setSelected(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-sm text-gray-500">No price requests yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Product</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Email</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">Received</th>
              </tr>
            </thead>
            <tbody>
              {items.map((request) => (
                <tr
                  key={request.id}
                  className="cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  onClick={() => setSelected(request)}
                >
                  <td className="px-4 py-2.5 font-medium text-gray-900">{request.productTitle}</td>
                  <td className="px-4 py-2.5 text-gray-700">{request.email}</td>
                  <td className="px-4 py-2.5 text-gray-500">{request.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="price-request-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="price-request-title" className="text-lg font-semibold text-gray-900">
                Price request
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Product</dt>
                <dd className="mt-1 text-gray-900">
                  <Link href={`/products/${selected.friendlyId}`} className="text-blue-700 hover:underline">
                    {selected.productTitle}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-gray-900">{selected.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">From</dt>
                <dd className="mt-1 text-gray-900">{selected.userName ?? 'Guest'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Received</dt>
                <dd className="mt-1 text-gray-900">{selected.createdAt}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap text-gray-900">{selected.message}</dd>
              </div>
            </dl>

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mt-6 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
