import { prisma } from '@/lib/prisma';
import { UserRound } from 'lucide-react';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl leading-tight tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? 'user' : 'users'} registered
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-muted/40 py-20 text-center">
          <p className="text-sm text-muted-foreground">No users yet.</p>
        </div>
      ) : (
        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-16 border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  #
                </th>
                <th className="w-10 border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground" />
                <th className="border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="border-r border-border/60 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="w-44 px-3 py-2.5 text-left font-medium text-muted-foreground">
                  Joined
                </th>
              </tr>
              </thead>
              <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b border-border/60 last:border-b-0 even:bg-muted/20 hover:bg-muted/40"
                >
                  <td className="border-r border-border/60 px-3 py-2 text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UserRound className="size-3.5" />
                    </div>
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 text-foreground">
                    {user.name ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 text-foreground">
                    {user.email}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {user.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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