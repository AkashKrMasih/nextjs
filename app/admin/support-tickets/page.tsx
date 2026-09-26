import { prisma } from '@/lib/prisma';
import { SupportTicketList } from './support-ticket-list';

export default async function AdminSupportTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { id: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-xl font-semibold text-gray-900">Support tickets</h1>
      <p className="mt-1 text-sm text-gray-500">
        {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}, newest first
      </p>
      <SupportTicketList
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          message: ticket.message,
          category: ticket.category,
          status: ticket.status,
          orderId: ticket.order.id,
          customerName: ticket.user.name ?? ticket.user.email,
          customerEmail: ticket.user.email,
          createdAt: ticket.createdAt.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        }))}
      />
    </main>
  );
}
