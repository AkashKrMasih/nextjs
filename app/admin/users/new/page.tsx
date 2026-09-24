import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { UserForm } from '../user-form';

export default function NewUserPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft className="size-4" />
        Back to users
      </Link>
      <h1 className="mt-4 mb-6 text-2xl tracking-tight text-stone-900">New user</h1>
      <UserForm />
    </main>
  );
}
