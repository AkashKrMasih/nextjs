import {NextResponse} from 'next/server';
import {mergeGuestCartIntoUser, readCart} from '@/lib/cart_db';

// Call this once, right after a successful login (e.g. in your NextAuth
// signIn callback, or client-side immediately after redirect).
export async function POST() {
  await mergeGuestCartIntoUser();
  const items = await readCart();
  return NextResponse.json({items});
}