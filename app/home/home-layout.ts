import { cookies } from 'next/headers';
import { HOME_LAYOUT_COOKIE, type HomeLayout } from './home-layout.constants';

export async function getHomeLayout(): Promise<HomeLayout | null> {
  const value = (await cookies()).get(HOME_LAYOUT_COOKIE)?.value;
  if (value === 'desktop' || value === 'mobile' || value === 'tablet') return value;
  return null;
}
