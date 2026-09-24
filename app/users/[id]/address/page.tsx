import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AddressManager } from './AddressManager';

export default async function AddressPage({
                                            params,
                                          }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Only the account owner (or an admin) can view/manage this address book.
  if (session.userId !== id) {
    notFound();
  }

  const addresses = await prisma.userAddress.findMany({
    where: { userId: id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <main className="max-w-6xl px-6 py-10">
      <h1 className="text-2xl tracking-tight text-stone-900">Saved addresses</h1>
      <p className="mt-1 text-sm text-green-800">
        Manage the addresses you ship to at checkout.
      </p>

      <AddressManager userId={id} initialAddresses={addresses} />
    </main>
  );
}