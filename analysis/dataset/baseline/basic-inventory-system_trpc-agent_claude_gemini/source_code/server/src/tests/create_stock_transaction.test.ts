import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { type CreateStockTransactionInput } from '../schema';
import { createStockTransaction } from '../handlers/create_stock_transaction';
import { eq } from 'drizzle-orm';

describe('createStockTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product
  const createTestProduct = async (initialStock = 50) => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_level: initialStock
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a stock_in transaction and increase stock level', async () => {
    const product = await createTestProduct(50);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_in',
      quantity: 25,
      notes: 'Restocking inventory'
    };

    const result = await createStockTransaction(input);

    // Verify transaction record
    expect(result.product_id).toEqual(product.id);
    expect(result.transaction_type).toEqual('stock_in');
    expect(result.quantity).toEqual(25);
    expect(result.notes).toEqual('Restocking inventory');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify stock level was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProducts[0].stock_level).toEqual(75); // 50 + 25
    expect(updatedProducts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a stock_out transaction and decrease stock level', async () => {
    const product = await createTestProduct(100);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_out',
      quantity: 30,
      notes: 'Sold to customer'
    };

    const result = await createStockTransaction(input);

    // Verify transaction record
    expect(result.product_id).toEqual(product.id);
    expect(result.transaction_type).toEqual('stock_out');
    expect(result.quantity).toEqual(30);
    expect(result.notes).toEqual('Sold to customer');

    // Verify stock level was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProducts[0].stock_level).toEqual(70); // 100 - 30
  });

  it('should create transaction with null notes when notes not provided', async () => {
    const product = await createTestProduct(50);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_in',
      quantity: 10
    };

    const result = await createStockTransaction(input);

    expect(result.notes).toBeNull();
    expect(result.quantity).toEqual(10);
  });

  it('should save transaction to database correctly', async () => {
    const product = await createTestProduct(50);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_in',
      quantity: 15,
      notes: 'Test transaction'
    };

    const result = await createStockTransaction(input);

    // Query the transaction from database
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_id).toEqual(product.id);
    expect(transactions[0].transaction_type).toEqual('stock_in');
    expect(transactions[0].quantity).toEqual(15);
    expect(transactions[0].notes).toEqual('Test transaction');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 999, // Non-existent product ID
      transaction_type: 'stock_in',
      quantity: 10,
      notes: 'Should fail'
    };

    await expect(createStockTransaction(input)).rejects.toThrow(/Product with id 999 not found/);
  });

  it('should throw error when stock_out would result in negative stock', async () => {
    const product = await createTestProduct(20); // Only 20 items in stock
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_out',
      quantity: 25, // Trying to take out more than available
      notes: 'Should fail'
    };

    await expect(createStockTransaction(input)).rejects.toThrow(/Insufficient stock/);
    
    // Verify stock level was not changed
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products[0].stock_level).toEqual(20); // Should remain unchanged
  });

  it('should allow stock_out that results in zero stock', async () => {
    const product = await createTestProduct(15);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_out',
      quantity: 15, // Exact stock amount
      notes: 'Empty inventory'
    };

    const result = await createStockTransaction(input);

    expect(result.quantity).toEqual(15);

    // Verify stock level is now zero
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProducts[0].stock_level).toEqual(0);
  });

  it('should handle large quantities correctly', async () => {
    const product = await createTestProduct(1000);
    
    const input: CreateStockTransactionInput = {
      product_id: product.id,
      transaction_type: 'stock_in',
      quantity: 5000,
      notes: 'Bulk restocking'
    };

    const result = await createStockTransaction(input);

    expect(result.quantity).toEqual(5000);

    // Verify stock level calculation
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(updatedProducts[0].stock_level).toEqual(6000); // 1000 + 5000
  });
});
