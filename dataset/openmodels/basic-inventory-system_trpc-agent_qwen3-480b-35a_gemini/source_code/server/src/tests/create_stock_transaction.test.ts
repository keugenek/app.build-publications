import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateStockTransactionInput } from '../schema';
import { createStockTransaction } from '../handlers/create_stock_transaction';

// Test product data
const testProduct = {
  name: 'Test Product',
  sku: 'TEST-SKU-001',
  stock_quantity: 50
};

describe('createStockTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product first
    await db.insert(productsTable)
      .values(testProduct)
      .execute();
  });
  
  afterEach(resetDB);

  it('should create an IN stock transaction and increase product stock', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 1,
      transaction_type: 'IN',
      quantity: 10,
      notes: 'Received new shipment'
    };

    const result = await createStockTransaction(input);
    
    // Check the transaction was created correctly
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(1);
    expect(result.transaction_type).toEqual('IN');
    expect(result.quantity).toEqual(10);
    expect(result.notes).toEqual('Received new shipment');
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Check that the product stock was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();
    
    expect(updatedProduct[0].stock_quantity).toEqual(60); // 50 + 10
  });

  it('should create an OUT stock transaction and decrease product stock', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 1,
      transaction_type: 'OUT',
      quantity: 5,
      notes: 'Sold to customer'
    };

    const result = await createStockTransaction(input);
    
    // Check the transaction was created correctly
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(1);
    expect(result.transaction_type).toEqual('OUT');
    expect(result.quantity).toEqual(5);
    expect(result.notes).toEqual('Sold to customer');
    
    // Check that the product stock was updated
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();
    
    expect(updatedProduct[0].stock_quantity).toEqual(45); // 50 - 5
  });

  it('should not allow stock to go below zero with OUT transactions', async () => {
    // First, update product to have very low stock
    await db.update(productsTable)
      .set({ stock_quantity: 2 })
      .where(eq(productsTable.id, 1))
      .execute();
    
    const input: CreateStockTransactionInput = {
      product_id: 1,
      transaction_type: 'OUT',
      quantity: 5, // This would make stock go to -3
      notes: 'Attempting to oversell'
    };

    const result = await createStockTransaction(input);
    
    // Check that the transaction was created
    expect(result.quantity).toEqual(5);
    
    // Check that the product stock was not allowed to go below zero
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();
    
    expect(updatedProduct[0].stock_quantity).toEqual(0); // Should be 0, not negative
  });

  it('should save transaction to database', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 1,
      transaction_type: 'IN',
      quantity: 20,
      notes: 'Additional stock'
    };

    const result = await createStockTransaction(input);

    // Query the transaction from database
    const transactions = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_id).toEqual(1);
    expect(transactions[0].transaction_type).toEqual('IN');
    expect(transactions[0].quantity).toEqual(20);
    expect(transactions[0].notes).toEqual('Additional stock');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error for non-existent product', async () => {
    const input: CreateStockTransactionInput = {
      product_id: 999, // Non-existent product
      transaction_type: 'IN',
      quantity: 10
    };

    await expect(createStockTransaction(input)).rejects.toThrow(/Product with id 999 not found/);
  });
});
