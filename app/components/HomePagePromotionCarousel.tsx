'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type HomePromotionSlide = {
  id: string;
  imageUrl: string;
  href: string | null;
};

export function HomePagePromotionCarousel({ slides }: { slides: HomePromotionSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const goTo = (index: number) => {
    setActive(((index % slides.length) + slides.length) % slides.length);
  };

  const slide = slides[active];
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.imageUrl}
      alt=""
      className="h-full w-full object-cover"
    />
  );

  return (
    <section className="mb-8" aria-label="Promotions">
      <div className="group relative aspect-[21/9] overflow-hidden rounded-xl bg-stone-100 sm:aspect-[3/1]">
        {slide.href ? (
          <Link href={slide.href} className="block h-full w-full">
            {image}
          </Link>
        ) : (
          image
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Previous promotion"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-900 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Next promotion"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-900 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to promotion ${index + 1}`}
                  className={[
                    'h-1.5 rounded-full transition-all',
                    index === active ? 'w-4 bg-white' : 'w-1.5 bg-white/70',
                  ].join(' ')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
