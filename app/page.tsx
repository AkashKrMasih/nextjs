import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Source_Serif_4, Inter } from 'next/font/google';

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
});

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F3] text-[#1E1B16]`}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="flex items-baseline justify-between border-b border-[#D8D2C4] pb-6 mb-10">
          <h1 className="font-[family-name:var(--font-serif)] text-2xl tracking-tight">
            My Blog
          </h1>
          <Link
            href="/new"
            className="font-[family-name:var(--font-sans)] text-sm text-[#55624A] hover:text-[#1E1B16] transition-colors"
          >
            new entry
          </Link>
        </header>

        {posts.length === 0 ? (
          <p className="font-[family-name:var(--font-sans)] text-sm text-[#8A8375]">
            Nothing here yet. Write your first entry.
          </p>
        ) : (
          <div>
            {posts.map((post, i) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                <article
                  className={`py-6 ${i !== 0 ? 'border-t border-[#D8D2C4]' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-[family-name:var(--font-serif)] text-xl leading-snug group-hover:text-[#55624A] transition-colors">
                      {post.title}
                    </h2>
                    <time className="font-[family-name:var(--font-sans)] text-xs text-[#8A8375] whitespace-nowrap shrink-0">
                      {post.createdAt.toDateString()}
                    </time>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
