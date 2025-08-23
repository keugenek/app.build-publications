import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateProductInput, type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test product input
const testProductInput: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_level: 50
};

// Test transaction inputs
const stockInInput: CreateTransactionInput = {
  product_sku: 'TEST-001',
  transaction_type: 'stock-in',
  quantity: 10
};

const stockOutInput: CreateTransactionInput = {
  product_sku: 'TEST-001',
  transaction_type: 'stock-out',
  quantity: 5
};

describe('createTransaction', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test product first
    await db.insert(productsTable)
      .values({
        name: testProductInput.name,
        sku: testProductInput.sku,
        stock_level: testProductInput.stock_level
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a stock-in transaction and increase product stock', async () => {
    const result = await createTransaction(stockInInput);

    // Validate transaction result
    expect(result.product_sku).toEqual(stockInInput.product_sku);
    expect(result.transaction_type).toEqual(stockInInput.transaction_type);
    expect(result.quantity).toEqual(stockInInput.quantity);
    expect(result.id).toBeDefined();
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Validate that product stock was updated
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, stockInInput.product_sku))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].stock_level).toEqual(testProductInput.stock_level + stockInInput.quantity);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a stock-out transaction and decrease product stock', async () => {
    const result = await createTransaction(stockOutInput);

    // Validate transaction result
    expect(result.product_sku).toEqual(stockOutInput.product_sku);
    expect(result.transaction_type).toEqual(stockOutInput.transaction_type);
    expect(result.quantity).toEqual(stockOutInput.quantity);

    // Validate that product stock was updated
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, stockOutInput.product_sku))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].stock_level).toEqual(testProductInput.stock_level - stockOutInput.quantity);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(stockInInput);

    // Query the transaction from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_sku).toEqual(stockInInput.product_sku);
    expect(transactions[0].transaction_type).toEqual(stockInInput.transaction_type);
    expect(transactions[0].quantity).toEqual(stockInInput.quantity);
    expect(transactions[0].transaction_date).toBeInstanceOf(Date);
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when product SKU does not exist', async () => {
    const invalidTransaction: CreateTransactionInput = {
      product_sku: 'NON-EXISTENT',
      transaction_type: 'stock-in',
      quantity: 5
    };

    await expect(createTransaction(invalidTransaction)).rejects.toThrow(/not found/i);
  });

  it('should throw an error when trying to stock out more than available quantity', async () => {
    const invalidStockOut: CreateTransactionInput = {
      product_sku: 'TEST-001',
      transaction_type: 'stock-out',
      quantity: 100 // More than the available stock (50)
    };

    await expect(createTransaction(invalidStockOut)).rejects.toThrow(/insufficient stock/i);
  });
});
