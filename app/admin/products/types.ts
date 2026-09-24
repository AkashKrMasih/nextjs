export type Category = {
  id: number;
  name: string;
};

export type ImageField = {
  key: string;
  file: File | null;
  url?: string;
  isPrimary: boolean;
};

export type VariantAttribute = {
  key: string;
  name: string;
  value: string;
};

// Product-level attribute, e.g. Material -> Cotton. Mirrors ProductAttribute.
export type AttributeField = {
  key: string;
  title: string;
  value: string;
};

// Suggestions for the title/value autocompletes, sourced from attributes
// already used elsewhere in the catalog.
export type AttributeOption = {
  title: string;
  values: string[];
};

export type VariantField = {
  key: string;
  id?: string;
  sku: string;
  name: string;
  price: string; // optional override; blank = use the product's base price
  quantity: string;
  isDefault: boolean;
  attributes: VariantAttribute[];
};


export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  priceOnRequest: boolean;
  categoryId: string; // '' = no category
  images: ImageField[];
  variants: VariantField[];
  attributes: AttributeField[];
};
