import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { UserRound, ChevronLeft } from 'lucide-react';
import { updateUser } from './actions';
import { DeleteUserButton } from './delete-user-button';

export default async function AdminUserDetailPage({
                                                    params,
                                                  }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  const updateUserWithId = updateUser.bind(null, user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to users
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <UserRound className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl leading-tight tracking-tight text-stone-900">
            {user.name ?? 'Unnamed user'}
          </h1>
          <p className="text-sm text-stone-500">
            Joined{' '}
            {user.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <form
        action={updateUserWithId}
        className="mt-8 space-y-5 rounded-lg border border-stone-200 p-5"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-stone-900"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name ?? ''}
            className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-900"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className="mt-1.5 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-800"
          />
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 pt-5">
          <DeleteUserButton userId={user.id} />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}