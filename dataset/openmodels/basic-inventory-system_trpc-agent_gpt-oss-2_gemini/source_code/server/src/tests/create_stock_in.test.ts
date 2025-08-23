import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockInTable } from '../db/schema';
import { type CreateStockInInput, type StockIn } from '../schema';
import { createStockIn } from '../handlers/create_stock_in';
import { eq } from 'drizzle-orm';

// Helper to create a product for testing
const testProduct = {
  name: 'Test Product',
  sku: 'TESTSKU',
  stock_quantity: 10,
};

describe('createStockIn', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a stock‑in transaction and update product stock', async () => {
    // Insert a product first
    const [product] = await db
      .insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const input: CreateStockInInput = {
      product_id: product.id,
      quantity: 5,
    };

    const result = await createStockIn(input);

    // Verify the returned transaction
    expect(result.id).toBeGreaterThan(0);
    expect(result.product_id).toEqual(product.id);
    expect(result.quantity).toEqual(5);
    expect(result.transaction_date).toBeInstanceOf(Date);

    // Verify stock quantity was incremented
    const [updatedProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProduct.stock_quantity).toEqual(testProduct.stock_quantity + 5);
  });

  it('should throw an error when product does not exist', async () => {
    const input: CreateStockInInput = {
      product_id: 9999,
      quantity: 1,
    };

    await expect(createStockIn(input)).rejects.toThrow(/does not exist/);
  });
});
