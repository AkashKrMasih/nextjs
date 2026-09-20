'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export type AddressFormState = { error?: string } | undefined;

// Confirms the caller is logged in and either owns this address book or is
// an admin. Throws for the "not logged in at all" case (shouldn't happen —
// the page itself redirects to /login — this is defense in depth), and
// returns a field error for the "logged in as someone else" case.
async function requireOwner(userId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  if (session.userId !== userId) {
    throw new Error('Not authorized');
  }

  // Guards against a stale session cookie pointing at a user id that no
  // longer exists (e.g. after a dev DB reset) — without this check that
  // case surfaces as a confusing UserAddress_userId_fkey violation instead.
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    throw new Error('Your session is out of date. Please log out and log back in.');
  }

  return session;
}

function readAddressFields(formData: FormData) {
  return {
    label: ((formData.get('label') as string) || '').trim() || null,
    name: ((formData.get('name') as string) || '').trim(),
    phone: ((formData.get('phone') as string) || '').trim() || null,
    address1: ((formData.get('address1') as string) || '').trim(),
    address2: ((formData.get('address2') as string) || '').trim() || null,
    city: ((formData.get('city') as string) || '').trim(),
    state: ((formData.get('state') as string) || '').trim() || null,
    postalCode: ((formData.get('postalCode') as string) || '').trim(),
    country: ((formData.get('country') as string) || '').trim(),
  };
}

function validate(fields: ReturnType<typeof readAddressFields>): string | null {
  if (!fields.name) return 'Recipient name is required.';
  if (!fields.address1) return 'Address is required.';
  if (!fields.city) return 'City is required.';
  if (!fields.postalCode) return 'Postal code is required.';
  if (!fields.country) return 'Country is required.';
  return null;
}

export async function createAddress(
  userId: string,
  _prevState: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  await requireOwner(userId);

  const fields = readAddressFields(formData);
  const validationError = validate(fields);
  if (validationError) return { error: validationError };

  const makeDefault = formData.get('isDefault') === 'on';
  const existingCount = await prisma.userAddress.count({ where: { userId } });

  await prisma.$transaction(async (tx) => {
    // First saved address is always the default, regardless of the checkbox.
    if (makeDefault || existingCount === 0) {
      await tx.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.userAddress.create({
      data: {
        ...fields,
        userId,
        isDefault: makeDefault || existingCount === 0,
      },
    });
  });

  revalidatePath(`/users/${userId}/address`);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  _prevState: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  await requireOwner(userId);

  const existing = await prisma.userAddress.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    return { error: 'That address could not be found.' };
  }

  const fields = readAddressFields(formData);
  const validationError = validate(fields);
  if (validationError) return { error: validationError };

  const makeDefault = formData.get('isDefault') === 'on';

  await prisma.$transaction(async (tx) => {
    if (makeDefault && !existing.isDefault) {
      await tx.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.userAddress.update({
      where: { id: addressId },
      data: {
        ...fields,
        // Once set, default can only be changed by checking the box here or
        // via setDefaultAddress — unchecking it on its own is a no-op so the
        // book is never left with zero defaults while other addresses exist.
        isDefault: makeDefault ? true : existing.isDefault,
      },
    });
  });

  revalidatePath(`/users/${userId}/address`);
}

export async function deleteAddress(userId: string, addressId: string) {
  await requireOwner(userId);

  const existing = await prisma.userAddress.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    throw new Error('That address could not be found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAddress.delete({ where: { id: addressId } });

    // If we just deleted the default, promote the oldest remaining address
    // so there's always a default when at least one address exists.
    if (existing.isDefault) {
      const next = await tx.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  revalidatePath(`/users/${userId}/address`);
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await requireOwner(userId);

  const existing = await prisma.userAddress.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    throw new Error('That address could not be found.');
  }

  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  revalidatePath(`/users/${userId}/address`);
}