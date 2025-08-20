import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product
  const createTestProduct = async (name: string = 'Test Product', initialStock: number = 50) => {
    const result = await db.insert(productsTable)
      .values({
        name,
        sku: `TEST-${Date.now()}`,
        stock_level: initialStock
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a stock_in transaction and increase stock level', async () => {
    // Create test product with initial stock of 50
    const product = await createTestProduct('Test Product', 50);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_in',
      quantity: 25,
      notes: 'Stock replenishment'
    };

    const result = await createTransaction(input);

    // Verify transaction was created correctly
    expect(result.product_id).toEqual(product.id);
    expect(result.type).toEqual('stock_in');
    expect(result.quantity).toEqual(25);
    expect(result.notes).toEqual('Stock replenishment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify product stock level was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(75); // 50 + 25
    expect(updatedProduct[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a stock_out transaction and decrease stock level', async () => {
    // Create test product with initial stock of 100
    const product = await createTestProduct('Test Product', 100);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_out',
      quantity: 30,
      notes: 'Sale transaction'
    };

    const result = await createTransaction(input);

    // Verify transaction was created correctly
    expect(result.product_id).toEqual(product.id);
    expect(result.type).toEqual('stock_out');
    expect(result.quantity).toEqual(30);
    expect(result.notes).toEqual('Sale transaction');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify product stock level was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(70); // 100 - 30
  });

  it('should create transaction without notes when not provided', async () => {
    const product = await createTestProduct('Test Product', 20);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_in',
      quantity: 10
      // notes not provided
    };

    const result = await createTransaction(input);

    expect(result.notes).toBeNull();
  });

  it('should save transaction to database', async () => {
    const product = await createTestProduct('Test Product', 40);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_in',
      quantity: 15,
      notes: 'Database test'
    };

    const result = await createTransaction(input);

    // Query transaction from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_id).toEqual(product.id);
    expect(transactions[0].type).toEqual('stock_in');
    expect(transactions[0].quantity).toEqual(15);
    expect(transactions[0].notes).toEqual('Database test');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject stock_out when insufficient stock exists', async () => {
    // Create product with low stock
    const product = await createTestProduct('Low Stock Product', 5);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_out',
      quantity: 10 // More than available stock
    };

    // Should throw error
    await expect(createTransaction(input)).rejects.toThrow(/insufficient stock/i);

    // Verify stock level wasn't changed
    const unchangedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(unchangedProduct[0].stock_level).toEqual(5); // Should remain unchanged
  });

  it('should reject transaction for non-existent product', async () => {
    const input: CreateTransactionInput = {
      product_id: 99999, // Non-existent product ID
      type: 'stock_in',
      quantity: 10
    };

    await expect(createTransaction(input)).rejects.toThrow(/product.*not found/i);
  });

  it('should allow stock_out that brings stock to zero', async () => {
    // Create product with exact stock amount
    const product = await createTestProduct('Zero Stock Test', 25);

    const input: CreateTransactionInput = {
      product_id: product.id,
      type: 'stock_out',
      quantity: 25 // Exact amount of stock
    };

    const result = await createTransaction(input);

    expect(result.quantity).toEqual(25);

    // Verify stock level is now zero
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(0);
  });

  it('should handle multiple sequential transactions correctly', async () => {
    const product = await createTestProduct('Sequential Test', 100);

    // First transaction: stock out 20
    await createTransaction({
      product_id: product.id,
      type: 'stock_out',
      quantity: 20
    });

    // Second transaction: stock in 30
    await createTransaction({
      product_id: product.id,
      type: 'stock_in',
      quantity: 30
    });

    // Third transaction: stock out 15
    const finalResult = await createTransaction({
      product_id: product.id,
      type: 'stock_out',
      quantity: 15
    });

    expect(finalResult).toBeDefined();

    // Verify final stock level: 100 - 20 + 30 - 15 = 95
    const finalProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(finalProduct[0].stock_level).toEqual(95);

    // Verify all transactions were recorded
    const allTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, product.id))
      .execute();

    expect(allTransactions).toHaveLength(3);
  });
});
