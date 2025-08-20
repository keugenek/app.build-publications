import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type CreateStockTransactionInput } from '../schema';
import { createStockTransaction } from '../handlers/create_stock_transaction';
import { eq } from 'drizzle-orm';

// Test product data
const testProduct = {
  name: 'Test Widget',
  sku: 'TW-001',
  description: 'A test widget for stock testing',
  stock_level: 50
};

describe('createStockTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let productId: number;

  beforeEach(async () => {
    // Create a test product for each test
    const result = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();
    productId = result[0].id;
  });

  it('should create STOCK_IN transaction and increase stock level', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_IN',
      quantity: 25,
      notes: 'Restocking from supplier'
    };

    const result = await createStockTransaction(input);

    // Verify transaction was created
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(productId);
    expect(result.transaction_type).toEqual('STOCK_IN');
    expect(result.quantity).toEqual(25);
    expect(result.notes).toEqual('Restocking from supplier');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify product stock level was updated (50 + 25 = 75)
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(75);
    expect(updatedProduct[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create STOCK_OUT transaction and decrease stock level', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_OUT',
      quantity: 15,
      notes: 'Sale to customer'
    };

    const result = await createStockTransaction(input);

    // Verify transaction was created
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(productId);
    expect(result.transaction_type).toEqual('STOCK_OUT');
    expect(result.quantity).toEqual(15);
    expect(result.notes).toEqual('Sale to customer');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify product stock level was updated (50 - 15 = 35)
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(35);
  });

  it('should create transaction with null notes when not provided', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_IN',
      quantity: 10
      // notes not provided
    };

    const result = await createStockTransaction(input);

    expect(result.notes).toBeNull();
  });

  it('should allow STOCK_OUT that reduces stock to exactly zero', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_OUT',
      quantity: 50, // Exactly current stock level
      notes: 'Clear all stock'
    };

    const result = await createStockTransaction(input);

    expect(result.quantity).toEqual(50);

    // Verify stock level is now zero
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(updatedProduct[0].stock_level).toEqual(0);
  });

  it('should save transaction to database', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_IN',
      quantity: 20,
      notes: 'Database test'
    };

    const result = await createStockTransaction(input);

    // Query transaction from database
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_id).toEqual(productId);
    expect(transactions[0].transaction_type).toEqual('STOCK_IN');
    expect(transactions[0].quantity).toEqual(20);
    expect(transactions[0].notes).toEqual('Database test');
  });

  it('should throw error when product does not exist', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 99999, // Non-existent product ID
      transaction_type: 'STOCK_IN',
      quantity: 10,
      notes: 'Should fail'
    };

    expect(createStockTransaction(input)).rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should throw error when STOCK_OUT would result in negative stock', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_OUT',
      quantity: 100, // More than current stock (50)
      notes: 'Too much stock out'
    };

    expect(createStockTransaction(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error when STOCK_OUT would result in negative stock by 1', async () => {
    const input: CreateStockTransactionInput = {
      product_id: productId,
      transaction_type: 'STOCK_OUT',
      quantity: 51, // One more than current stock (50)
      notes: 'Just over the limit'
    };

    expect(createStockTransaction(input)).rejects.toThrow(/insufficient stock.*current stock: 50.*requested: 51/i);
  });
});
