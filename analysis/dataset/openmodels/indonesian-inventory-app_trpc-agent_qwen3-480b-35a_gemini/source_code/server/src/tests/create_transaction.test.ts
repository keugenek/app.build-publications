import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product directly in the database
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        stock_quantity: 50
      })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a stock-in transaction and increase product stock', async () => {
    const input: CreateTransactionInput = {
      product_id: 1,
      type: 'masuk',
      quantity: 20,
      transaction_date: new Date()
    };

    const result = await createTransaction(input);

    // Validate transaction
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(1);
    expect(result.type).toEqual('masuk');
    expect(result.quantity).toEqual(20);
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Validate product stock was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(updatedProducts).toHaveLength(1);
    expect(updatedProducts[0].stock_quantity).toEqual(70); // 50 + 20
  });

  it('should create a stock-out transaction and decrease product stock', async () => {
    const input: CreateTransactionInput = {
      product_id: 1,
      type: 'keluar',
      quantity: 15,
      transaction_date: new Date()
    };

    const result = await createTransaction(input);

    // Validate transaction
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(1);
    expect(result.type).toEqual('keluar');
    expect(result.quantity).toEqual(15);
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Validate product stock was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(updatedProducts).toHaveLength(1);
    expect(updatedProducts[0].stock_quantity).toEqual(35); // 50 - 15
  });

  it('should fail to create a transaction for non-existent product', async () => {
    const input: CreateTransactionInput = {
      product_id: 999, // Non-existent product
      type: 'masuk',
      quantity: 10,
      transaction_date: new Date()
    };

    await expect(createTransaction(input)).rejects.toThrow(/Product with id 999 not found/);
  });

  it('should fail to create a stock-out transaction that would result in negative stock', async () => {
    const input: CreateTransactionInput = {
      product_id: 1,
      type: 'keluar',
      quantity: 100, // More than available stock (50)
      transaction_date: new Date()
    };

    await expect(createTransaction(input)).rejects.toThrow(/Insufficient stock/);
  });

  it('should save transaction to database', async () => {
    const input: CreateTransactionInput = {
      product_id: 1,
      type: 'masuk',
      quantity: 10,
      transaction_date: new Date()
    };

    const result = await createTransaction(input);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].product_id).toEqual(1);
    expect(transactions[0].type).toEqual('masuk');
    expect(transactions[0].quantity).toEqual(10);
    
    // Handle date conversion properly
    const transactionDate = typeof transactions[0].transaction_date === 'string' 
      ? new Date(transactions[0].transaction_date) 
      : transactions[0].transaction_date;
    expect(transactionDate).toBeInstanceOf(Date);
    
    const createdAtDate = typeof transactions[0].created_at === 'string' 
      ? new Date(transactions[0].created_at) 
      : transactions[0].created_at;
    expect(createdAtDate).toBeInstanceOf(Date);
  });
});