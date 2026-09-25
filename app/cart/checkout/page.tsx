'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {readCart, type CartItem} from '@/lib/cart';
import {formatPrice} from '@/lib/money';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';

type SessionUser = { id: string; email: string; name: string | null };
type AuthState = 'loading' | 'authed' | 'anonymous';
type FlowState = 'choice' | 'guest-form' | 'paying';
type AppliedDiscount = {
  code: string;
  discountCents: number;
  amountTotalCents: number;
  subtotalCents: number;
  lines: { productId: number; unitPriceCents: number; quantity: number }[];
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser]           = useState<SessionUser | null>(null);

  const [flow, setFlow]                     = useState<FlowState>('choice');
  const [guestEmail, setGuestEmail]         = useState('');
  const [clientSecret, setClientSecret]     = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [discountInput, setDiscountInput]   = useState('');
  const [applied, setApplied]               = useState<AppliedDiscount | null>(null);
  const [applying, setApplying]             = useState(false);

  useEffect(() => {
    (async () => {
      setItems(await readCart());
      setReady(true);

      // ADAPT: if you already have a session-check call elsewhere in the app,
      // reuse it instead of this fetch.
      const res  = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        setAuthState('authed');
      } else {
        setAuthState('anonymous');
      }
    })();
  }, []);

  // Once we know who's paying (logged-in user, or guest who entered an email),
  // create the PaymentIntent and move into the card-form step.
  async function startPayment(guestEmailValue?: string) {
    setError(null);
    setCreatingIntent(true);
    try {
      const res  = await fetch('/api/checkout/create-payment-intent', {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify({
          items:        items.map((i) => ({id: i.id, quantity: i.quantity})),
          guestEmail:   guestEmailValue,
          discountCode: applied?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout');
      setClientSecret(data.clientSecret);
      setFlow('paying');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreatingIntent(false);
    }
  }

  async function applyDiscount() {
    setError(null);
    setApplying(true);
    try {
      const res = await fetch('/api/discounts/preview', {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify({
          code:  discountInput,
          items: items.map((item) => ({id: item.id, quantity: item.quantity})),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not apply that code');
      setApplied(data);
    } catch (e) {
      setApplied(null);
      setError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  if (!ready || authState === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-stone-500">Loading checkout…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-stone-500">
          Your cart is empty.{' '}
          <Link href="/" className="text-green-800 underline">
            Browse the catalog
          </Link>
          .
        </p>
      </main>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const total = applied ? applied.amountTotalCents / 100 : subtotal;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl tracking-tight">Checkout</h1>

      <div className="mt-6 space-y-2 border-b border-stone-300 pb-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-stone-500">
              {formatPrice(
                ((applied?.lines.find((line) => line.productId === item.id)?.unitPriceCents
                  ?? Math.round(Number(item.price) * 100)) * item.quantity) / 100
              )}
            </span>
          </div>
        ))}
        {applied ? (
          <div className="flex justify-between pt-2 text-sm text-green-800">
            <span>Discount {applied.code}</span>
            <span>−{formatPrice(applied.discountCents / 100)}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-2 text-base">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {flow !== 'paying' && (
        <form
          className="mt-6 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyDiscount();
          }}
        >
          <label className="text-sm text-stone-500">
            Discount code
            <input
              value={discountInput}
              onChange={(event) => setDiscountInput(event.target.value.toUpperCase())}
              className="mt-1 block w-48 rounded border border-stone-300 p-2 text-sm uppercase text-stone-900"
              placeholder="CODE"
            />
          </label>
          <button
            type="submit"
            disabled={applying || !discountInput.trim()}
            className="rounded border border-green-800 px-4 py-2 text-sm text-green-800 disabled:opacity-50"
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
          {applied ? (
            <button
              type="button"
              onClick={() => {
                setApplied(null);
                setDiscountInput('');
              }}
              className="text-sm text-stone-500 underline"
            >
              Remove
            </button>
          ) : null}
        </form>
      )}

      <div className="mt-8">
        {authState === 'anonymous' && flow === 'choice' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500">
              Log in for order history and faster checkout next time, or continue as a guest.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?redirect=${encodeURIComponent('/cart/checkout')}`}
                className="rounded border border-green-800 px-4 py-2 text-center text-sm text-green-800"
              >
                Log in
              </Link>
              <button
                type="button"
                onClick={() => setFlow('guest-form')}
                className="rounded bg-green-800 px-4 py-2 text-center text-sm text-white"
              >
                Continue as guest
              </button>
            </div>
          </div>
        )}

        {authState === 'anonymous' && flow === 'guest-form' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startPayment(guestEmail);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="guestEmail" className="block text-sm text-stone-500">
                Email for your receipt
              </label>
              <input
                id="guestEmail"
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 p-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-800">{error}</p>}
            <button
              type="submit"
              disabled={creatingIntent}
              className="rounded bg-green-800 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {creatingIntent ? 'Loading…' : 'Continue to payment'}
            </button>
            <button
              type="button"
              onClick={() => setFlow('choice')}
              className="ml-3 text-sm text-stone-500 underline"
            >
              Back
            </button>
          </form>
        )}

        {flow === 'paying' && clientSecret && (
          <CheckoutForm
            clientSecret={clientSecret}
            payerLabel={user?.email ?? guestEmail}
          />
        )}

        {authState === 'authed' && flow === 'choice' && (
          <button
            type="button"
            onClick={() => startPayment()}
            disabled={creatingIntent}
            className="rounded bg-green-800 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {creatingIntent ? 'Loading…' : 'Continue to payment'}
          </button>
        )}

        {error && flow !== 'guest-form' && <p className="mt-4 text-sm text-red-800">{error}</p>}
      </div>
    </main>
  );
}