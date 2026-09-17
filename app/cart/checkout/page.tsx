'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {cartTotal, readCart, type CartItem} from '@/lib/cart';
import {formatPrice} from '@/lib/money';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';
import {auth} from "@/lib/auth";

type SessionUser = { id: string; email: string; name: string | null };
type AuthState = 'loading' | 'authed' | 'anonymous';
type FlowState = 'choice' | 'guest-form' | 'paying';

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
          items:      items.map((i) => ({id: i.id, quantity: i.quantity})),
          guestEmail: guestEmailValue,
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

  useEffect(() => {
    if (ready && authState === 'authed' && flow === 'choice') {
      startPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authState]);

  if (!ready || authState === 'loading') {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-[#8A8375]">Loading checkout…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-[#8A8375]">
          Your cart is empty.{' '}
          <Link href="/" className="text-[#55624A] underline">
            Browse the catalog
          </Link>
          .
        </p>
      </main>
    );
  }

  const total = cartTotal();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl tracking-tight">Checkout</h1>

      <div className="mt-6 space-y-2 border-b border-[#D8D2C4] pb-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-[#8A8375]">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 text-base">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-8">
        {authState === 'anonymous' && flow === 'choice' && (
          <div className="space-y-6">
            <p className="text-sm text-[#8A8375]">
              Log in for order history and faster checkout next time, or continue as a guest.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?redirect=${encodeURIComponent('/cart/checkout')}`}
                className="rounded border border-[#55624A] px-4 py-2 text-center text-sm text-[#55624A]"
              >
                Log in
              </Link>
              <button
                type="button"
                onClick={() => setFlow('guest-form')}
                className="rounded bg-[#55624A] px-4 py-2 text-center text-sm text-white"
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
              <label htmlFor="guestEmail" className="block text-sm text-[#8A8375]">
                Email for your receipt
              </label>
              <input
                id="guestEmail"
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded border border-[#D8D2C4] p-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-800">{error}</p>}
            <button
              type="submit"
              disabled={creatingIntent}
              className="rounded bg-[#55624A] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {creatingIntent ? 'Loading…' : 'Continue to payment'}
            </button>
            <button
              type="button"
              onClick={() => setFlow('choice')}
              className="ml-3 text-sm text-[#8A8375] underline"
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

        {authState === 'authed' && flow === 'choice' && creatingIntent && (
          <p className="text-sm text-[#8A8375]">Preparing checkout…</p>
        )}

        {error && flow !== 'guest-form' && <p className="mt-4 text-sm text-red-800">{error}</p>}
      </div>
    </main>
  );
}