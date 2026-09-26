'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SUPPORT_TICKET_CATEGORIES } from '@/lib/support-tickets';

type OrderOption = {
  id: string;
  label: string;
};

export function SupportTicketForm({
  orders,
  initialOrderId,
}: {
  orders: OrderOption[];
  initialOrderId?: string;
}) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(initialOrderId ?? orders[0]?.id ?? '');
  const [category, setCategory] = useState(SUPPORT_TICKET_CATEGORIES[0].value);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.set('orderId', orderId);
    formData.set('category', category);
    formData.set('subject', subject);
    formData.set('message', message);

    const response = await fetch('/api/support-tickets', {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not submit your ticket.');
      return;
    }

    router.push('/support');
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <p className="mt-6 text-sm text-stone-500">
        You need at least one order before you can open a support ticket.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="orderId" className="block text-sm font-medium text-stone-900">
          Order
        </label>
        <select
          id="orderId"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm text-stone-900"
          required
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-stone-900">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm text-stone-900"
          required
        >
          {SUPPORT_TICKET_CATEGORIES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-stone-900">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={200}
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm text-stone-900"
          placeholder="Brief summary of your issue"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-900">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          maxLength={5000}
          className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm text-stone-900"
          placeholder="Describe what happened and how we can help"
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded border border-green-800 px-4 py-2 text-sm text-green-800 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit ticket'}
      </button>
    </form>
  );
}
