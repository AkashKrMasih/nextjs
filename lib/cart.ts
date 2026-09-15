export type CartItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
};

export const CART_EVENT = 'shop-cart-changed';

function emit() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_EVENT));
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {'Content-Type': 'application/json', ...init?.headers},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Cart request failed (${res.status})`);
  }
  return res.json();
}

export async function readCart(): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>('/api/cart');
  return items;
}

export async function addToCart(
  item: Omit<CartItem, 'quantity'>,
  quantity = 1
): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>('/api/cart', {
    method: 'POST',
    body:   JSON.stringify({...item, quantity}),
  });
  emit();
  return items;
}

export async function updateQuantity(id: number, quantity: number): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>('/api/cart', {
    method: 'PATCH',
    body:   JSON.stringify({id, quantity}),
  });
  emit();
  return items;
}

export async function removeFromCart(id: number): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>(`/api/cart?id=${id}`, {
    method: 'DELETE',
  });
  emit();
  return items;
}

export async function clearCart(): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>('/api/cart', {method: 'DELETE'});
  emit();
  return items;
}

export async function cartCount(): Promise<number> {
  const items = await readCart();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function cartTotal(): Promise<number> {
  const items = await readCart();
  return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

// Call once, right after a successful login (e.g. in your NextAuth
// signIn callback or a post-login effect), to fold the guest cart in.
export async function mergeGuestCartOnLogin(): Promise<CartItem[]> {
  const {items} = await api<{ items: CartItem[] }>('/api/cart/merge', {method: 'POST'});
  emit();
  return items;
}