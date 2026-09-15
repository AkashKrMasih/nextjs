import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/admin/products'); // runs on server, before render
}