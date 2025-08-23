import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockOutTable } from '../db/schema';
import { type CreateStockOutInput, type StockOut } from '../schema';
import { createStockOut } from '../handlers/create_stock_out';
import { eq } from 'drizzle-orm';

// Helper to create a product directly in DB for testing
const createTestProduct = async () => {
  const [product] = await db
    .insert(productsTable)
    .values({
      name: 'Test Product',
      sku: 'TESTSKU',
      stock_quantity: 20,
    })
    .returning()
    .execute();
  return product;
};

describe('createStockOut', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a stock-out record and decrement product stock', async () => {
    const product = await createTestProduct();
    const input: CreateStockOutInput = {
      product_id: product.id,
      quantity: 5,
    };

    const result: StockOut = await createStockOut(input);

    // Verify returned record fields
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(product.id);
    expect(result.quantity).toEqual(5);
    expect(result.transaction_date).toBeInstanceOf(Date);

    // Verify stock_out table contains the record
    const stockOutRows = await db
      .select()
      .from(stockOutTable)
      .where(eq(stockOutTable.id, result.id))
      .execute();
    expect(stockOutRows).toHaveLength(1);
    expect(stockOutRows[0].quantity).toEqual(5);

    // Verify product stock_quantity decreased
    const [updatedProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();
    expect(updatedProduct.stock_quantity).toEqual(15); // 20 - 5
  });
});
