import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Blog</h1>
      <Link href="/new" className="text-blue-600 underline mb-4 block">
        + New Post
      </Link>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border rounded p-4">
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </Link>
            <p className="text-gray-600 text-sm">
              {post.createdAt.toDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
