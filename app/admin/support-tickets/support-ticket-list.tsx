'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  SUPPORT_TICKET_STATUSES,
  supportTicketCategoryLabel,
  supportTicketStatusLabel,
} from '@/lib/support-tickets';

export type SupportTicketRow = {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
};

function statusClass(status: string) {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'bg-green-100 text-green-800';
  if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800';
  return 'bg-stone-100 text-stone-700';
}

export function SupportTicketList({ tickets }: { tickets: SupportTicketRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tickets);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function updateStatus(id: string, status: string) {
    if (updatingId) return;
    setUpdatingId(id);
    setError('');

    const response = await fetch(`/api/support-tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json().catch(() => ({}));
    setUpdatingId(null);

    if (!response.ok) {
      setError(payload.error ?? 'Could not update status');
      return;
    }

    setItems((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket))
    );
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="mt-10 text-sm text-gray-500">No support tickets yet.</p>;
  }

  return (
    <div className="mt-10">
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="px-3 py-2.5 font-medium text-gray-500">Subject</th>
              <th className="px-3 py-2.5 font-medium text-gray-500">Customer</th>
              <th className="px-3 py-2.5 font-medium text-gray-500">Order</th>
              <th className="px-3 py-2.5 font-medium text-gray-500">Category</th>
              <th className="px-3 py-2.5 font-medium text-gray-500">Status</th>
              <th className="px-3 py-2.5 font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 align-top last:border-0">
                <td className="px-3 py-3 text-gray-900">
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-500">{ticket.message}</p>
                </td>
                <td className="px-3 py-3 text-gray-700">
                  <p>{ticket.customerName}</p>
                  <p className="text-xs text-gray-500">{ticket.customerEmail}</p>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-gray-600">{ticket.orderId}</td>
                <td className="px-3 py-3 text-gray-700">
                  {supportTicketCategoryLabel(ticket.category)}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs ${statusClass(ticket.status)}`}
                  >
                    {supportTicketStatusLabel(ticket.status)}
                  </span>
                  <select
                    value={ticket.status}
                    disabled={updatingId === ticket.id}
                    onChange={(event) => updateStatus(ticket.id, event.target.value)}
                    className="mt-2 block w-full max-w-[9rem] rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                    aria-label={`Update status for ${ticket.subject}`}
                  >
                    {SUPPORT_TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {supportTicketStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3 text-gray-500">{ticket.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
