import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { products, stock_transactions } from '../db/schema';
import { type StockTransaction } from '../schema';
import { getStockTransactions } from '../handlers/get_stock_transactions';
import { eq } from 'drizzle-orm';

/**
 * Helper to create a product for foreign key relations.
 */
const createTestProduct = async (name: string, sku: string) => {
  const [product] = await db
    .insert(products)
    .values({ name, sku, stock_quantity: 0 })
    .returning()
    .execute();
  return product;
};

/**
 * Helper to create a stock transaction linked to a product.
 */
const createTestTransaction = async (productId: number, type: 'stock_in' | 'stock_out', quantity: number) => {
  const [tx] = await db
    .insert(stock_transactions)
    .values({ product_id: productId, type, quantity })
    .returning()
    .execute();
  return tx;
};

describe('getStockTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no transactions exist', async () => {
    const transactions = await getStockTransactions();
    expect(Array.isArray(transactions)).toBeTrue();
    expect(transactions).toHaveLength(0);
  });

  it('should fetch all stock transactions from the database', async () => {
    // Arrange: create a product and two transactions
    const product = await createTestProduct('Test Product', 'SKU123');
    const tx1 = await createTestTransaction(product.id, 'stock_in', 10);
    const tx2 = await createTestTransaction(product.id, 'stock_out', 5);

    // Act
    const transactions = await getStockTransactions();

    // Assert: both transactions are returned
    expect(transactions).toHaveLength(2);
    // Compare by id, type, quantity, and product_id
    const ids = transactions.map((t) => t.id).sort();
    expect(ids).toEqual([tx1.id, tx2.id].sort());

    const fetchedTx1 = transactions.find((t) => t.id === tx1.id)!;
    expect(fetchedTx1.product_id).toBe(product.id);
    expect(fetchedTx1.type).toBe('stock_in');
    expect(fetchedTx1.quantity).toBe(10);
    expect(fetchedTx1.created_at).toBeInstanceOf(Date);

    const fetchedTx2 = transactions.find((t) => t.id === tx2.id)!;
    expect(fetchedTx2.type).toBe('stock_out');
    expect(fetchedTx2.quantity).toBe(5);
    expect(fetchedTx2.created_at).toBeInstanceOf(Date);
  });
});
