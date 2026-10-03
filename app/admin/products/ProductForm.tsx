'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  Category,
  ImageField,
  VariantAttribute,
  AttributeField,
  AttributeOption,
  VariantField,
  ProductFormValues
} from "@/app/admin/products/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/app/components/ui/utils';

const TAB_LIST_CLASS =
  'h-auto w-full shrink-0 flex-col items-stretch gap-0.5 rounded-lg border border-stone-200 bg-stone-50 p-1 sm:w-44';
const TAB_TRIGGER_CLASS =
  'w-full flex-none justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm';

let uid = 0;

function newKey() {
  uid += 1;
  return `k${Date.now()}-${uid}`;
}

function emptyVariant(isDefault = false): VariantField {
  return {
    key:        newKey(),
    sku:        '',
    name:       '',
    price:      '',
    quantity:   '0',
    isDefault,
    attributes: [],
  };
}

function emptyAttribute(): AttributeField {
  return {
    key:   newKey(),
    title: '',
    value: '',
  };
}

function emptyValues(): ProductFormValues {
  return {
    name:        '',
    friendlyId:  '',
    description: '',
    price:           '',
    minOrderQuantity: '',
    maxOrderQuantity: '',
    returnInDays:    '',
    categoryId:      '',
    pincodeTemplateId: '',
    customPincodes: '',
    images:      [],
    variants:    [emptyVariant(true)],
    attributes:  [],
  };
}

export function ProductForm({
                              productId,
                              initial,
                            }: {
  productId?: number;
  initial?: ProductFormValues;
}) {
  const router                                  = useRouter();
  const [values, setValues]                     = useState<ProductFormValues>(initial ?? emptyValues());
  const [categories, setCategories]             = useState<Category[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
  const [pincodeTemplates, setPincodeTemplates] = useState<{ id: string; title: string }[]>([]);
  const [error, setError]                       = useState('');
  const [saving, setSaving]                     = useState(false);

  useEffect(() => {
    fetch('/api/categories')
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => setCategories(Array.isArray(data) ? data : []))
    .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetch('/api/pincode-templates')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPincodeTemplates(Array.isArray(data) ? data : []))
      .catch(() => setPincodeTemplates([]));
  }, []);

  useEffect(() => {
    fetch('/api/attributes')
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => setAttributeOptions(Array.isArray(data) ? data : []))
    .catch(() => setAttributeOptions([]));
  }, []);

  // Existing values suggested for a given attribute title, so picking an
  // already-used title (e.g. "Material") also suggests its known values
  // (e.g. "Cotton", "Wool") — case-insensitive match on title.
  function valuesForTitle(title: string): string[] {
    const normalized = title.trim().toLowerCase();
    if (!normalized) return [];
    return (
      attributeOptions.find((a) => a.title.trim().toLowerCase() === normalized)?.values ?? []
    );
  }

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({...current, [key]: value}));
  }

  // --- images ---
  function addImage() {
    update('images', [
      ...values.images,
      {key: newKey(), file: null, isPrimary: values.images.length === 0},
    ]);
  }

  function updateImage(key: string, patch: Partial<ImageField>) {
    update('images', values.images.map((img) => (img.key === key ? {...img, ...patch} : img)));
  }

  function removeImage(key: string) {
    const remaining = values.images.filter((img) => img.key !== key);
    if (remaining.length && !remaining.some((img) => img.isPrimary)) {
      remaining[0] = {...remaining[0], isPrimary: true};
    }
    update('images', remaining);
  }

  function makePrimary(key: string) {
    update('images', values.images.map((img) => ({...img, isPrimary: img.key === key})));
  }

  // --- variants ---
  function addVariant() {
    update('variants', [...values.variants, emptyVariant(false)]);
  }

  function updateVariant(key: string, patch: Partial<VariantField>) {
    update('variants', values.variants.map((v) => (v.key === key ? {...v, ...patch} : v)));
  }

  function removeVariant(key: string) {
    const remaining = values.variants.filter((v) => v.key !== key);
    if (remaining.length && !remaining.some((v) => v.isDefault)) {
      remaining[0] = {...remaining[0], isDefault: true};
    }
    update('variants', remaining);
  }

  function makeDefaultVariant(key: string) {
    update('variants', values.variants.map((v) => ({...v, isDefault: v.key === key})));
  }

  function addAttribute(variantKey: string) {
    const variant = values.variants.find((v) => v.key === variantKey);
    if (!variant) return;
    updateVariant(variantKey, {
      attributes: [...variant.attributes, {key: newKey(), name: '', value: ''}],
    });
  }

  function updateAttribute(
    variantKey: string,
    attrKey: string,
    patch: Partial<VariantAttribute>
  ) {
    const variant = values.variants.find((v) => v.key === variantKey);
    if (!variant) return;
    updateVariant(variantKey, {
      attributes: variant.attributes.map((a) => (a.key === attrKey ? {...a, ...patch} : a)),
    });
  }

  function removeAttribute(variantKey: string, attrKey: string) {
    const variant = values.variants.find((v) => v.key === variantKey);
    if (!variant) return;
    updateVariant(variantKey, {
      attributes: variant.attributes.filter((a) => a.key !== attrKey),
    });
  }

  // --- product attributes ---
  function addAttributeRow() {
    update('attributes', [...values.attributes, emptyAttribute()]);
  }

  function updateAttributeTitle(key: string, title: string) {
    update(
      'attributes',
      values.attributes.map((a) => (a.key === key ? {...a, title} : a))
    );
  }

  function removeAttributeRow(key: string) {
    update('attributes', values.attributes.filter((a) => a.key !== key));
  }

  function updateAttributeValue(attrKey: string, value: string) {
    update(
      'attributes',
      values.attributes.map((a) => (a.key === attrKey ? {...a, value} : a))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (values.variants.some((v) => !v.sku.trim())) {
      setError('Every variant needs a SKU.');
      return;
    }
    if (!values.variants.some((v) => v.isDefault)) {
      setError('Pick one variant as the default.');
      return;
    }

    setSaving(true);

    const attributes = values.attributes
      .map((a) => ({title: a.title.trim(), value: a.value.trim()}))
      .filter((a) => a.title && a.value);
    const variants = values.variants.map((v) => ({
      id:         v.id,
      sku:        v.sku.trim(),
      name:       v.name.trim() || null,
      price:      v.price.trim() || null,
      isDefault:  v.isDefault,
      quantity:   Number(v.quantity) || 0,
      attributes: v.attributes.reduce<Record<string, string>>((acc, a) => {
        if (a.name.trim()) acc[a.name.trim()] = a.value;
        return acc;
      }, {}),
    }));
    const existingImages = values.images
      .filter((img) => img.url && !img.file)
      .map((img) => ({url: img.url, isPrimary: img.isPrimary}));

    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('friendlyId', values.friendlyId);
    formData.set('description', values.description);
    formData.set('price', values.price);
    formData.set('minOrderQuantity', values.minOrderQuantity);
    formData.set('maxOrderQuantity', values.maxOrderQuantity);
    formData.set('returnInDays', values.returnInDays);
    formData.set('categoryId', values.categoryId);
    formData.set('pincodeTemplateId', values.pincodeTemplateId);
    formData.set('customPincodes', values.customPincodes);
    formData.set('attributes', JSON.stringify(attributes));
    formData.set('variants', JSON.stringify(variants));
    formData.set('existingImages', JSON.stringify(existingImages));

    for (const img of values.images) {
      if (!img.file) continue;
      formData.append('images', img.file);
      formData.append('imageIsPrimary', img.isPrimary ? 'true' : 'false');
    }

    const response = await fetch(productId ? `/api/products/${productId}` : '/api/products', {
      method: productId ? 'PUT' : 'POST',
      body:   formData,
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? 'Could not save product');
      return;
    }

    router.push(`/products/${payload.friendlyId}`);
    router.refresh();
  }

  const showVariantsTab = !productId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs
        defaultValue="general"
        orientation="vertical"
        className="flex flex-col gap-6 sm:flex-row sm:items-start"
      >
        <TabsList className={TAB_LIST_CLASS}>
          <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
            General
          </TabsTrigger>
          <TabsTrigger value="delivery" className={TAB_TRIGGER_CLASS}>
            Delivery
          </TabsTrigger>
          <TabsTrigger value="images" className={TAB_TRIGGER_CLASS}>
            Images{values.images.length > 0 ? ` (${values.images.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="attributes" className={TAB_TRIGGER_CLASS}>
            Attributes{values.attributes.length > 0 ? ` (${values.attributes.length})` : ''}
          </TabsTrigger>
          {showVariantsTab ? (
            <TabsTrigger value="variants" className={TAB_TRIGGER_CLASS}>
              Variants ({values.variants.length})
            </TabsTrigger>
          ) : null}
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="general" className="mt-0 space-y-4">
            <p className="text-sm text-stone-500">Name, pricing, and catalog details.</p>
            <input
              className="w-full rounded border border-stone-300 bg-white p-2"
              placeholder="Product name"
              required
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
            />
            <input
              className="w-full rounded border border-stone-300 bg-white p-2"
              placeholder="Friendly id (optional — derived from the title if blank)"
              value={values.friendlyId}
              onChange={(e) => update('friendlyId', e.target.value)}
            />
            <textarea
              className="h-32 w-full rounded border border-stone-300 bg-white p-2"
              placeholder="Description"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded border border-stone-300 bg-white p-2"
                placeholder="Base price"
                type="number"
                min="0"
                step="0.01"
                required
                value={values.price}
                onChange={(e) => update('price', e.target.value)}
              />
              <select
                className="w-full rounded border border-stone-300 bg-white p-2"
                value={values.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="minOrderQuantity" className="block text-sm font-medium text-stone-700">
                  Min order quantity
                </label>
                <input
                  id="minOrderQuantity"
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2"
                  placeholder="Optional"
                  type="number"
                  min="1"
                  step="1"
                  value={values.minOrderQuantity}
                  onChange={(e) => update('minOrderQuantity', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="maxOrderQuantity" className="block text-sm font-medium text-stone-700">
                  Max order quantity
                </label>
                <input
                  id="maxOrderQuantity"
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2"
                  placeholder="Optional"
                  type="number"
                  min="1"
                  step="1"
                  value={values.maxOrderQuantity}
                  onChange={(e) => update('maxOrderQuantity', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="returnInDays" className="block text-sm font-medium text-stone-700">
                  Return window (days)
                </label>
                <input
                  id="returnInDays"
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2"
                  placeholder="Optional"
                  type="number"
                  min="1"
                  step="1"
                  value={values.returnInDays}
                  onChange={(e) => update('returnInDays', e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-stone-500">
              Optional per-product limits enforced when customers add items to the cart and at checkout.
            </p>
          </TabsContent>

          <TabsContent value="delivery" className="mt-0 space-y-3">
            <p className="text-sm text-stone-500">
              Optional. If set, customers can only checkout when their delivery postal code matches.
            </p>
            <div>
              <label htmlFor="pincodeTemplateId" className="block text-sm font-medium text-stone-700">
                Pincode template
              </label>
              <select
                id="pincodeTemplateId"
                className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm"
                value={values.pincodeTemplateId}
                onChange={(e) => {
                  update('pincodeTemplateId', e.target.value);
                  if (e.target.value) update('customPincodes', '');
                }}
                disabled={Boolean(values.customPincodes.trim())}
              >
                <option value="">No template</option>
                {pincodeTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="customPincodes" className="block text-sm font-medium text-stone-700">
                Or custom pincodes (comma-separated)
              </label>
              <input
                id="customPincodes"
                className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm"
                placeholder="110001, 110002, 400001"
                value={values.customPincodes}
                onChange={(e) => {
                  update('customPincodes', e.target.value);
                  if (e.target.value.trim()) update('pincodeTemplateId', '');
                }}
                disabled={Boolean(values.pincodeTemplateId)}
              />
            </div>
          </TabsContent>

          <TabsContent value="images" className="mt-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">Product photos. Mark one as primary.</p>
              <button type="button" onClick={addImage} className="text-sm text-green-800 underline">
                + Add image
              </button>
            </div>
        {values.images.length === 0 ? (
          <p className="text-sm text-stone-500">No images yet.</p>
        ) : (
          values.images.map((img) => (
            <div key={img.key} className="flex items-center gap-2">
              {img.url && !img.file ? (
                <img src={img.url} alt="" className="h-12 w-12 rounded object-cover" />
              ) : null}
              <input
                className="flex-1 rounded border border-stone-300 bg-white p-2 text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => updateImage(img.key, {file: e.target.files?.[0] ?? null})}
              />
              {img.file ? (
                <span className="max-w-32 truncate text-xs text-stone-500">{img.file.name}</span>
              ) : null}
              <label className="flex items-center gap-1 text-xs text-green-800">
                <input
                  type="radio"
                  name="primaryImage"
                  checked={img.isPrimary}
                  onChange={() => makePrimary(img.key)}
                />
                Primary
              </label>
              <button
                type="button"
                onClick={() => removeImage(img.key)}
                className="text-xs text-red-700"
              >
                Remove
              </button>
            </div>
          ))
        )}
          </TabsContent>

          <TabsContent value="attributes" className="mt-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-stone-500">
                Specs like Material or Weight.
              </p>
              <button
                type="button"
                onClick={addAttributeRow}
                className="shrink-0 text-sm text-green-800 underline"
              >
                + Add attribute
              </button>
            </div>
            <p className="text-xs text-stone-500">
          Specs like Material or Weight. Start typing a name to reuse one already in your
          catalog — anything new is created automatically when you save.
        </p>

        {/* Shared datalist of known attribute titles, reused by every row below */}
        <datalist id="attribute-title-options">
          {attributeOptions.map((opt) => (
            <option key={opt.title} value={opt.title}/>
          ))}
        </datalist>

        {values.attributes.length === 0 ? (
          <p className="text-sm text-stone-500">No attributes yet.</p>
        ) : (
          values.attributes.map((attr) => {
            const valueSuggestions = valuesForTitle(attr.title);
            const valuesListId     = `attribute-values-${attr.key}`;
            return (
              <div key={attr.key} className="space-y-2 rounded border border-stone-300 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border border-stone-300 bg-white p-2"
                    placeholder="Attribute name (e.g. Material)"
                    list="attribute-title-options"
                    value={attr.title}
                    onChange={(e) => updateAttributeTitle(attr.key, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttributeRow(attr.key)}
                    className="text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>

                {/* Suggestions for this specific attribute's value */}
                <datalist id={valuesListId}>
                  {valueSuggestions.map((v) => (
                    <option key={v} value={v}/>
                  ))}
                </datalist>

                <input
                  className="w-full rounded border border-stone-300 bg-white p-1.5 text-sm"
                  placeholder="Value (e.g. Cotton)"
                  list={valuesListId}
                  value={attr.value}
                  onChange={(e) => updateAttributeValue(attr.key, e.target.value)}
                />
              </div>
            );
          })
        )}
          </TabsContent>

          {showVariantsTab ? (
            <TabsContent value="variants" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-500">SKUs, stock, and variant options.</p>
                <button type="button" onClick={addVariant} className="text-sm text-green-800 underline">
                  + Add variant
                </button>
              </div>

        {values.variants.map((v, i) => (
          <div key={v.key} className="space-y-3 rounded border border-stone-300 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">Variant {i + 1}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-green-800">
                  <input
                    type="radio"
                    name="defaultVariant"
                    checked={v.isDefault}
                    onChange={() => makeDefaultVariant(v.key)}
                  />
                  Default
                </label>
                {values.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(v.key)}
                    className="text-xs text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded border border-stone-300 bg-white p-2"
                placeholder="SKU"
                required
                value={v.sku}
                onChange={(e) => updateVariant(v.key, {sku: e.target.value})}
              />
              <input
                className="rounded border border-stone-300 bg-white p-2"
                placeholder="Variant name (e.g. Red / Large)"
                value={v.name}
                onChange={(e) => updateVariant(v.key, {name: e.target.value})}
              />
              <input
                className="rounded border border-stone-300 bg-white p-2"
                placeholder="Price override (optional)"
                type="number"
                min="0"
                step="0.01"
                value={v.price}
                onChange={(e) => updateVariant(v.key, {price: e.target.value})}
              />
              <input
                className="rounded border border-stone-300 bg-white p-2"
                placeholder="Stock quantity"
                type="number"
                min="0"
                step="1"
                required
                value={v.quantity}
                onChange={(e) => updateVariant(v.key, {quantity: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">Options</span>
                <button
                  type="button"
                  onClick={() => addAttribute(v.key)}
                  className="text-xs text-green-800 underline"
                >
                  + Add option
                </button>
              </div>
              {v.attributes.map((a) => (
                <div key={a.key} className="flex items-center gap-2">
                  <input
                    className="w-1/3 rounded border border-stone-300 bg-white p-1.5 text-sm"
                    placeholder="color"
                    value={a.name}
                    onChange={(e) => updateAttribute(v.key, a.key, {name: e.target.value})}
                  />
                  <input
                    className="flex-1 rounded border border-stone-300 bg-white p-1.5 text-sm"
                    placeholder="Red"
                    value={a.value}
                    onChange={(e) => updateAttribute(v.key, a.key, {value: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(v.key, a.key)}
                    className="text-xs text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
            </TabsContent>
          ) : null}
        </div>
      </Tabs>

      <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-6">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          className={cn(
            'rounded bg-green-800 px-4 py-2 text-white disabled:opacity-60',
            error ? '' : 'ml-auto'
          )}
          disabled={saving}
        >
          {saving ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}