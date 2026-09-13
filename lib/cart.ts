export type CartItem = {
  id: number;
  name: string;
  price: string;
  quantity: number;
};

export const CART_EVENT = 'shop-cart-changed';
const KEY = 'shop-cart';

function emit() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_EVENT));
  }
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  emit();
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  const items = readCart();
  const existing = items.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }
  writeCart(items);
}

export function updateQuantity(id: number, quantity: number) {
  if (quantity < 1) {
    removeFromCart(id);
    return;
  }
  writeCart(
    readCart().map((entry) =>
      entry.id === id ? { ...entry, quantity } : entry
    )
  );
}

export function removeFromCart(id: number) {
  writeCart(readCart().filter((entry) => entry.id !== id));
}

export function clearCart() {
  writeCart([]);
}

export function cartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal() {
  return readCart().reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
}
