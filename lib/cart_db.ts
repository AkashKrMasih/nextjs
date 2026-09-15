import 'server-only';
import { prisma } from '@/lib/prisma'; // existing Prisma client singleton
import { getOrCreateGuestSessionId, getGuestSessionId } from '@/lib/cart_session';
import { auth } from '@/lib/auth';

export type CartItemDTO = {
  id: number;
  name: string;
  price: string;
  quantity: number;
};

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Finds the caller's active cart (by userId if logged in, else guest
 * sessionId), creating one if it doesn't exist yet.
 */
async function getOrCreateCart() {
  const userId = await getCurrentUserId();

  if (userId) {
    const existing = await prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: true },
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId, status: 'ACTIVE' },
      include: { items: true },
    });
  }

  const sessionId = await getOrCreateGuestSessionId();
  const existing = await prisma.cart.findFirst({
    where: { sessionId, status: 'ACTIVE' },
    include: { items: true },
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { sessionId, status: 'ACTIVE' },
    include: { items: true },
  });
}

function toDTO(items: { productId: number; name: string; price: unknown; quantity: number }[]): CartItemDTO[] {
  return items.map((i) => ({
    id: i.productId,
    name: i.name,
    price: String(i.price),
    quantity: i.quantity,
  }));
}

export async function readCart(): Promise<CartItemDTO[]> {
  const cart = await getOrCreateCart();
  return toDTO(cart.items);
}

export async function addToCart(
  item: { id: number; name: string; price: string },
  quantity = 1
): Promise<CartItemDTO[]> {
  const cart = await getOrCreateCart();

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: item.id } },
    update: { quantity: { increment: quantity } },
    create: {
      cartId: cart.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity,
    },
  });

  return readCart();
}

export async function updateQuantity(productId: number, quantity: number): Promise<CartItemDTO[]> {
  const cart = await getOrCreateCart();

  if (quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { quantity },
    });
  }

  return readCart();
}

export async function removeFromCart(productId: number): Promise<CartItemDTO[]> {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return readCart();
}

export async function clearCart(): Promise<CartItemDTO[]> {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return [];
}

/**
 * Call right after a guest logs in. Merges the guest cart (by cookie) into
 * the now-authenticated user's cart, summing quantities on conflicts.
 */
export async function mergeGuestCartIntoUser(): Promise<void> {
  const userId = await getCurrentUserId();
  const guestSessionId = await getGuestSessionId();
  if (!userId || !guestSessionId) return;

  const guestCart = await prisma.cart.findFirst({
    where: { sessionId: guestSessionId, status: 'ACTIVE' },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await prisma.cart.upsert({
    where: { id: (await getOrCreateCart()).id },
    update: {},
    create: { userId, status: 'ACTIVE' },
  });

  for (const item of guestCart.items) {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      },
    });
  }

  await prisma.cart.update({ where: { id: guestCart.id }, data: { status: 'ABANDONED' } });
}