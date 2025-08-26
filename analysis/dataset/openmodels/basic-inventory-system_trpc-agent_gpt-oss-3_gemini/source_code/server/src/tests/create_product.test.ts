import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { products } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input covering all required fields
const testInput: CreateProductInput = {
  name: 'Test Widget',
  sku: 'TW-001',
  stock_quantity: 50,
};

describe('createProduct handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('inserts a product and returns the created record', async () => {
    const result = await createProduct(testInput);

    // Validate returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.name).toBe(testInput.name);
    expect(result.sku).toBe(testInput.sku);
    expect(result.stock_quantity).toBe(testInput.stock_quantity);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('persists the product in the database', async () => {
    const created = await createProduct(testInput);

    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbProduct = rows[0];
    expect(dbProduct.name).toBe(testInput.name);
    expect(dbProduct.sku).toBe(testInput.sku);
    expect(dbProduct.stock_quantity).toBe(testInput.stock_quantity);
    expect(dbProduct.created_at).toBeInstanceOf(Date);
  });
});
