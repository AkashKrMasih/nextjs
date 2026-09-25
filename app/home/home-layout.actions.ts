'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { HOME_LAYOUT_COOKIE, type HomeLayout } from './home-layout.constants';

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
  revalidatePath('/');
}
