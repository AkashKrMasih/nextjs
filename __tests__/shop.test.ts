jest.mock('@/lib/prisma', () => ({ prisma: {} }));

import { slugify } from '@/lib/categories';
import { normalizeDiscountCode, parseDiscountForm } from '@/lib/discounts';
import { validateEmail } from '@/lib/utils';

describe('shop rules', () => {
  it('builds a friendly id from a product title', () => {
    expect(slugify('  Summer Oak Chair! ')).toBe('summer-oak-chair');
  });

  it('normalizes a discount code to uppercase without surrounding spaces', () => {
    expect(normalizeDiscountCode('  save10 ')).toBe('SAVE10');
  });

  it('rejects a percent discount above 100', () => {
    const form = new FormData();
    form.set('code', 'HALF');
    form.set('kind', 'PERCENT');
    form.set('value', '150');
    form.set('expiresAt', new Date(Date.now() + 60_000).toISOString());

    expect(parseDiscountForm(form)).toEqual({ error: 'Percent cannot be more than 100.' });
  });

  it('accepts an all-products discount that expires in the future', () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const form = new FormData();
    form.set('code', 'save-10');
    form.set('kind', 'AMOUNT');
    form.set('value', '10');
    form.set('productId', '');
    form.set('expiresAt', expiresAt);

    const parsed = parseDiscountForm(form);
    expect(parsed).toMatchObject({
      code: 'SAVE-10',
      kind: 'AMOUNT',
      value: '10.00',
      productId: null,
    });
  });

  it('rejects an email that has no domain', () => {
    expect(validateEmail('ada@')).toBe('Enter a valid email address');
  });
});
