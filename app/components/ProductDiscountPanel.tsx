'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/money';
import {
  CHECKOUT_DISCOUNT_STORAGE_KEY,
  formatDiscountOfferLabel,
  type ProductDiscountOffer,
} from '@/lib/discounts';

type PreviewResult = {
  code: string;
  discountCents: number;
  amountTotalCents: number;
  lines: { productId: number; unitPriceCents: number; originalUnitPriceCents: number }[];
};

const OFFERS_INITIAL_LIMIT = 5;

export function ProductDiscountPanel({
  productId,
  basePrice,
  quantity,
}: {
  productId: number;
  basePrice: string;
  quantity: number;
}) {
  const [offers, setOffers] = useState<ProductDiscountOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setShowAllOffers(false);
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOffersLoading(true);
      try {
        const response = await fetch(`/api/discounts/offers?productId=${productId}`);
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && Array.isArray(data.offers)) {
          setOffers(data.offers);
        }
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (preview?.code) {
      applyCode(preview.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-price when quantity changes
  }, [quantity]);

  async function applyCode(rawCode: string) {
    const code = rawCode.trim();
    if (!code) return;

    setApplying(true);
    setError('');
    setCodeInput(code);

    const response = await fetch('/api/discounts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        items: [{ id: productId, quantity }],
      }),
    });
    const data = await response.json().catch(() => ({}));
    setApplying(false);

    if (!response.ok) {
      setPreview(null);
      setError(data.error ?? 'Could not apply that code');
      return;
    }

    const line = data.lines?.find((entry: { productId: number }) => entry.productId === productId);
    if (!line?.unitPriceCents || line.unitPriceCents >= line.originalUnitPriceCents) {
      setPreview(null);
      setError('This code does not apply to this product.');
      return;
    }

    setPreview({
      code: data.code,
      discountCents: data.discountCents,
      amountTotalCents: data.amountTotalCents,
      lines: data.lines,
    });
    sessionStorage.setItem(CHECKOUT_DISCOUNT_STORAGE_KEY, data.code);
  }

  const previewLine = preview?.lines.find((line) => line.productId === productId);
  const visibleOffers = showAllOffers
    ? offers
    : offers.slice(0, OFFERS_INITIAL_LIMIT);
  const hasMoreOffers = offers.length > OFFERS_INITIAL_LIMIT;

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/80 p-4">
      <div>
        <h2 className="text-sm font-medium text-stone-900">Discount codes</h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Try a code below. The same code is applied at checkout when you pay.
        </p>
      </div>

      {offersLoading ? (
        <p className="text-xs text-stone-500">Loading offers…</p>
      ) : offers.length > 0 ? (
        <div className="space-y-2">
          <ul className="flex flex-wrap gap-2">
            {visibleOffers.map((offer) => (
              <li key={offer.code}>
                <button
                  type="button"
                  onClick={() => applyCode(offer.code)}
                  disabled={applying}
                  className="rounded-full border border-green-800/30 bg-white px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50 disabled:opacity-50"
                >
                  <span className="font-mono">{offer.code}</span>
                  <span className="text-stone-500">
                    {' '}
                    · {formatDiscountOfferLabel(offer, (value) => formatPrice(value))}
                  </span>
                  {offer.scope === 'product' ? (
                    <span className="text-stone-400"> · this item</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {hasMoreOffers && !showAllOffers ? (
            <button
              type="button"
              onClick={() => setShowAllOffers(true)}
              className="text-xs font-medium text-green-800 hover:underline"
            >
              Show all
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-stone-500">No public offers for this product right now.</p>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyCode(codeInput);
        }}
      >
        <label className="min-w-[10rem] flex-1 text-xs text-stone-600">
          Have a code?
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value)}
            placeholder="Enter code"
            className="mt-1 w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm uppercase text-stone-900"
          />
        </label>
        <button
          type="submit"
          disabled={applying || !codeInput.trim()}
          className="rounded border border-green-800 px-3 py-1.5 text-sm text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          {applying ? 'Checking…' : 'Apply'}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {preview && previewLine ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          <p>
            Code <span className="font-mono font-medium">{preview.code}</span> applied for{' '}
            {quantity} {quantity === 1 ? 'item' : 'items'}.
          </p>
          <p className="mt-1">
            <span className="text-stone-500 line-through">
              {formatPrice(Number(basePrice) * quantity)}
            </span>
            {' '}
            <span className="font-medium text-green-900">
              {formatPrice(preview.amountTotalCents / 100)}
            </span>
            <span className="text-green-800">
              {' '}
              (save {formatPrice(preview.discountCents / 100)})
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
