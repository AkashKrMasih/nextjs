import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // ADAPT: your custom session helper

// ADAPT: if you already expose an equivalent endpoint (e.g. /api/me),
// delete this file and point the checkout page's fetch at that one instead.
export async function GET() {
  const user = await auth();
  console.info("user............................................");
  console.info(user);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name ?? null },
  });
}