'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setHomeLayout } from '@/app/home/home-layout.actions';
import { type HomeLayout } from '@/app/home/home-layout.constants';

function screenLayout(): HomeLayout {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function HomeLayoutPrompt({ saved }: { saved: HomeLayout | null }) {
  const router = useRouter();
  const [offer, setOffer] = useState<HomeLayout | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const screen = screenLayout();
    const current = saved ?? 'desktop';
    setOffer(screen === current ? null : screen);
  }, [saved]);

  if (!offer) return null;

  async function choose(accept: boolean) {
    if (!accept) {
      setOffer(null);
      return;
    }
    setSaving(true);
    await setHomeLayout(offer!);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="home-layout-title"
        className="w-full max-w-md rounded-lg border border-stone-300 bg-white p-5 shadow-lg"
      >
        <h2 id="home-layout-title" className="text-lg text-stone-900">
          Do you want to load the {offer} version of this page?
        </h2>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => choose(false)}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => choose(true)}
            className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
