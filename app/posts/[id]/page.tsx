import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
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

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });

  if (!post) return notFound();

  return (
    <main
      className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FAF8F3] text-[#1E1B16]`}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="font-[family-name:var(--font-sans)] text-sm text-[#8A8375] hover:text-[#55624A] transition-colors"
        >
          ← index
        </Link>

        <article className="mt-8">
          <header className="border-b border-[#D8D2C4] pb-6 mb-8">
            <h1 className="font-[family-name:var(--font-serif)] text-3xl leading-snug tracking-tight">
              {post.title}
            </h1>
            <time className="font-[family-name:var(--font-sans)] text-xs text-[#8A8375] mt-3 block">
              {post.createdAt.toDateString()}
            </time>
          </header>

          <p className="font-[family-name:var(--font-serif)] text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </article>
      </div>
    </main>
  );
}
