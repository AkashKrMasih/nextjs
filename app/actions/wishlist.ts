'use server';

import {prisma} from '@/lib/prisma';
import {getCurrentUser} from '@/lib/auth';
import {revalidatePath} from 'next/cache';
import {log} from "@/lib/utils"
import chalk from "chalk";

type ToggleResult =
  | { ok: true; wishlisted: boolean }
  | { ok: false; error: 'UNAUTHENTICATED' | 'NOT_FOUND' };

/**
 * Adds the product to the current user's wishlist if it isn't there yet,
 * or removes it if it already is. Creates the user's Wishlist row on
 * first use (Wishlist is 1:1 with User).
 */
export async function toggleWishlist(productId: number): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {ok: false, error: 'UNAUTHENTICATED'};
  }

  const product = await prisma.product.findUnique({
    where:  {id: productId},
    select: {id: true},
  });
  if (!product) {
    return {ok: false, error: 'NOT_FOUND'};
  }

  const wishlist = await prisma.wishlist.upsert({
    where:  {userId: user.id},
    create: {userId: user.id},
    update: {},
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: {wishlistId_productId: {wishlistId: wishlist.id, productId}},
  });

  if (existing) {
    await prisma.wishlistItem.delete({where: {id: existing.id}});
    revalidatePath(`/products/${productId}`);
    revalidatePath('/wishlist');
    revalidatePath('/');
    return {ok: true, wishlisted: false};
  }

  await prisma.wishlistItem.create({
    data: {wishlistId: wishlist.id, productId},
  });
  revalidatePath(`/products/${productId}`);
  revalidatePath('/wishlist');
  revalidatePath('/');
  return {ok: true, wishlisted: true};
}

/** Whether the current user (if any) has this product wishlisted. */
export async function isProductWishlisted(productId: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const item = await prisma.wishlistItem.findFirst({
    where:  {productId, wishlist: {userId: user.id}},
    select: {id: true},
  });
  return Boolean(item);
}

/**
 * All product ids the current user has wishlisted — handy for catalog/grid
 * pages that need to show filled hearts on many cards at once without an
 * isProductWishlisted() call per card.
 */
export async function getWishlistedProductIds(): Promise<Set<number>> {
  const user = await getCurrentUser();
  if (!user) return new Set();

  console.log(chalk.green.bold('firing query........................'));
  const wishlist = await prisma.wishlist.findUnique({
    where:   {userId: user.id},
    include: {items: {select: {productId: true}}},
  });

  if (!wishlist) return new Set();

  return new Set(wishlist.items.map((i) => i.productId));
}
