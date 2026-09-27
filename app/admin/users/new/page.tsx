import { PageHeader } from '@/app/components/PageHeader';
import { UserForm } from '../user-form';

export default function NewUserPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-10">
      <PageHeader
        title="New user"
        description="Create a customer or admin account."
        backHref="/admin/users"
        backLabel="Back to users"
        variant="admin"
        className="mb-6"
      />
      <UserForm />
    </main>
  );
}
