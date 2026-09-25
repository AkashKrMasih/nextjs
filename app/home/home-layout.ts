import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const HOME_LAYOUT_COOKIE = 'home_layout';
export type HomeLayout = 'desktop' | 'mobile' | 'tablet';

// Plain server-side read helper — call this from Server Components / route handlers.
export async function getHomeLayout(): Promise<HomeLayout | null> {
  const value = (await cookies()).get(HOME_LAYOUT_COOKIE)?.value;
  if (value === 'desktop' || value === 'mobile' || value === 'tablet') return value;
  return null;
}

// Server Actions — safe to import and call directly from Client Components
// (e.g. in a <form action={setHomeLayout}> or onClick={() => chooseDesktopHome()}).
export async function setHomeLayout(layout: HomeLayout) {
  'use server';
  const store = await cookies();
  store.set(HOME_LAYOUT_COOKIE, layout, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function chooseDesktopHome() {
  'use server';
  await setHomeLayout('desktop');
  revalidatePath('/');
}