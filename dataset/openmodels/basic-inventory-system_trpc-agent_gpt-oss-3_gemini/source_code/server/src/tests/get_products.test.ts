import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { products } from '../db/schema';
import { getProducts } from '../handlers/get_products';

const testProduct = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_quantity: 42,
};

describe('getProducts handler', () => {
  beforeEach(async () => {
    await createDB();
  });

  afterEach(async () => {
    await resetDB();
  });

  it('returns an empty array when no products exist', async () => {
    const result = await getProducts();
    expect(Array.isArray(result)).toBeTrue();
    expect(result).toHaveLength(0);
  });

  it('fetches all products from the database', async () => {
    // Insert a product directly via Drizzle
    const inserted = await db
      .insert(products)
      .values(testProduct)
      .returning()
      .execute();

    const expected = inserted[0];

    const result = await getProducts();
    expect(result).toHaveLength(1);
    const fetched = result[0];
    expect(fetched.id).toBe(expected.id);
    expect(fetched.name).toBe(testProduct.name);
    expect(fetched.sku).toBe(testProduct.sku);
    expect(fetched.stock_quantity).toBe(testProduct.stock_quantity);
    expect(fetched.created_at).toBeInstanceOf(Date);
  });
});
