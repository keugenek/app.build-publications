import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { products, stock_transactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createStockTransaction } from '../handlers/create_stock_transaction';
import { type CreateStockTransactionInput } from '../schema';

// Helper to create a product directly in DB for testing
const createTestProduct = async (overrides?: Partial<{ name: string; sku: string; stock_quantity: number }>) => {
  const base = {
    name: 'Test Product',
    sku: 'TESTSKU',
    stock_quantity: 50,
  };
  const data = { ...base, ...overrides };
  const result = await db
    .insert(products)
    .values(data)
    .returning()
    .execute();
  return result[0];
};

describe('createStockTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a stock_in transaction and increase product stock', async () => {
    const product = await createTestProduct();
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      type: 'stock_in',
      quantity: 20,
    };

    const transaction = await createStockTransaction(input);

    expect(transaction).toBeDefined();
    expect(transaction.product_id).toBe(product.id);
    expect(transaction.type).toBe('stock_in');
    expect(transaction.quantity).toBe(20);
    expect(transaction.id).toBeDefined();
    expect(transaction.created_at).toBeInstanceOf(Date);

    // Verify product stock updated
    const updatedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .execute();
    expect(updatedProduct).toHaveLength(1);
    expect(updatedProduct[0].stock_quantity).toBe(product.stock_quantity + 20);
  });

  it('should create a stock_out transaction and decrease product stock', async () => {
    const product = await createTestProduct({ stock_quantity: 30 });
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      type: 'stock_out',
      quantity: 10,
    };

    const transaction = await createStockTransaction(input);
    expect(transaction.type).toBe('stock_out');
    expect(transaction.quantity).toBe(10);

    const updated = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .execute();
    expect(updated[0].stock_quantity).toBe(20);
  });

  it('should reject stock_out that would result in negative stock', async () => {
    const product = await createTestProduct({ stock_quantity: 5 });
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      type: 'stock_out',
      quantity: 10,
    };

    await expect(createStockTransaction(input)).rejects.toThrow(/Insufficient stock/);

    // Ensure stock unchanged
    const after = await db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .execute();
    expect(after[0].stock_quantity).toBe(5);
  });

  it('should reject transaction for non‑existent product', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 99999,
      type: 'stock_in',
      quantity: 5,
    };
    await expect(createStockTransaction(input)).rejects.toThrow(/does not exist/);
  });
});
