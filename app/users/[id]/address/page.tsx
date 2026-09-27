import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
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
      <PageHeader
        title="Saved addresses"
        description="Manage the addresses you ship to at checkout."
        variant="store"
      />

      <AddressManager userId={id} initialAddresses={addresses} />
    </main>
  );
}