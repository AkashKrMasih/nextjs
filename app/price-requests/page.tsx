import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function MyPriceRequestsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const requests = await prisma.priceRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl tracking-tight text-stone-900">Your price requests</h1>
      <p className="mt-1 text-sm text-stone-500">Newest first</p>

      {requests.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">You have not sent any price requests.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="rounded-lg border border-stone-300 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/products/${request.productId}`}
                  className="font-medium text-stone-900 hover:text-green-800"
                >
                  {request.productTitle}
                </Link>
                <time className="text-xs text-stone-500">
                  {request.createdAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="mt-1 text-sm text-stone-500">{request.email}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{request.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
