import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import {
  shortOrderId,
  supportTicketCategoryLabel,
  supportTicketStatusLabel,
} from '@/lib/support-tickets';

function statusClass(status: string) {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'bg-green-100 text-green-800';
  if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800';
  return 'bg-stone-100 text-stone-700';
}

export default async function SupportPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: { id: true, createdAt: true, status: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl tracking-tight text-stone-900">Customer support</h1>
          <p className="mt-1 text-sm text-stone-500">Your tickets, newest first</p>
        </div>
        <Link
          href="/support/new"
          className="rounded border border-green-800 px-4 py-2 text-sm text-green-800 hover:bg-green-50"
        >
          New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">
          You have not opened any support tickets yet.{' '}
          <Link href="/support/new" className="text-green-800 hover:text-stone-900">
            Create one
          </Link>{' '}
          if you need help with an order.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-lg border border-stone-300 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium text-stone-900">{ticket.subject}</h2>
                <time className="text-xs text-stone-500">
                  {ticket.createdAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Order #{shortOrderId(ticket.order.id)} ·{' '}
                {supportTicketCategoryLabel(ticket.category)}
              </p>
              <span
                className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${statusClass(ticket.status)}`}
              >
                {supportTicketStatusLabel(ticket.status)}
              </span>
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{ticket.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
