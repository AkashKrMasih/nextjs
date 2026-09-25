'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const HOME_LAYOUT_COOKIE = 'home_layout';
export type HomeLayout = 'desktop' | 'mobile' | 'tablet';

export async function getHomeLayout(): Promise<HomeLayout | null> {
  const value = (await cookies()).get(HOME_LAYOUT_COOKIE)?.value;
  if (value === 'desktop' || value === 'mobile' || value === 'tablet') return value;
  return null;
}

export async function setHomeLayout(layout: HomeLayout) {
  const store = await cookies();
  store.set(HOME_LAYOUT_COOKIE, layout, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function chooseDesktopHome() {
  await setHomeLayout('desktop');
  redirect('/');
}
