import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ addresses: [] });
  }

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      label: true,
      name: true,
      postalCode: true,
      city: true,
      isDefault: true,
    },
  });

  return NextResponse.json({ addresses });
}
