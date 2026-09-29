import { productStock } from '@/lib/home-catalog-query';

export type HomeCatalogProductDto = {
  id: number;
  friendlyId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  stock: number;
  wishlisted: boolean;
};

export function serializeHomeCatalogProduct(
  product: {
    id: number;
    friendlyId: string;
    name: string;
    price: { toString(): string };
    images: { url: string }[];
    variants: { inventory: { quantity: number } | null }[];
  },
  wishlistedIds: Set<number>
): HomeCatalogProductDto {
  return {
    id: product.id,
    friendlyId: product.friendlyId,
    name: product.name,
    price: product.price.toString(),
    imageUrl: product.images[0]?.url ?? null,
    stock: productStock(product),
    wishlisted: wishlistedIds.has(product.id),
  };
}
