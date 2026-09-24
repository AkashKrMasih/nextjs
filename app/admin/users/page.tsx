import { prisma } from '@/lib/prisma';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { DeleteUserButton } from './delete-user-button';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tight text-stone-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} registered
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          New user
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-100/40 py-20 text-center">
          <p className="text-sm text-stone-500">No users yet.</p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-lg border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="border-b border-stone-200 bg-stone-100/50">
                <th className="w-16 border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500">
                  #
                </th>
                <th className="w-10 border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500" />
                <th className="border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500">
                  Name
                </th>
                <th className="border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500">
                  Email
                </th>
                <th className="w-32 border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500">
                  Role
                </th>
                <th className="w-44 border-r border-stone-200/60 px-3 py-2.5 text-left font-medium text-stone-500">
                  Joined
                </th>
                <th className="w-40 px-3 py-2.5 text-left font-medium text-stone-500">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b border-stone-200/60 last:border-b-0 even:bg-stone-100/20 hover:bg-stone-100/40"
                >
                  <td className="border-r border-stone-200/60 px-3 py-2 text-stone-500">
                    {i + 1}
                  </td>
                  <td className="border-r border-stone-200/60 px-3 py-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                      <UserRound className="size-3.5" />
                    </div>
                  </td>
                  <td className="border-r border-stone-200/60 px-3 py-2 text-stone-900">
                    {user.name ?? (
                      <span className="text-stone-500">—</span>
                    )}
                  </td>
                  <td className="border-r border-stone-200/60 px-3 py-2 text-stone-900">
                    {user.email}
                  </td>
                  <td className="border-r border-stone-200/60 px-3 py-2 text-stone-900">
                    {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </td>
                  <td className="border-r border-stone-200/60 px-3 py-2 text-stone-500">
                    {user.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-900 hover:bg-stone-100"
                      >
                        Edit
                      </Link>
                      <DeleteUserButton userId={user.id} />
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}