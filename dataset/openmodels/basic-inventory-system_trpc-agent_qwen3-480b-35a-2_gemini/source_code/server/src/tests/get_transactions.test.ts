import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, productsTable } from '../db/schema';
import { type CreateProductInput, type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

// Test data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  sku: 'TEST-001',
  stock_level: 50
};

const testTransaction1: CreateTransactionInput = {
  product_sku: 'TEST-001',
  transaction_type: 'stock-in',
  quantity: 10
};

const testTransaction2: CreateTransactionInput = {
  product_sku: 'TEST-001',
  transaction_type: 'stock-out',
  quantity: 5
};

describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a product first as transactions reference it
    await db.insert(productsTable)
      .values(testProduct)
      .execute();
      
    // Create test transactions
    await db.insert(transactionsTable)
      .values(testTransaction1)
      .execute();
      
    await db.insert(transactionsTable)
      .values(testTransaction2)
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all transactions', async () => {
    const transactions = await getTransactions();

    expect(transactions).toHaveLength(2);
    
    // Check first transaction
    const transaction1 = transactions.find(t => t.quantity === 10);
    expect(transaction1).toBeDefined();
    expect(transaction1!.product_sku).toEqual('TEST-001');
    expect(transaction1!.transaction_type).toEqual('stock-in');
    expect(transaction1!.quantity).toEqual(10);
    expect(transaction1!.id).toBeDefined();
    expect(transaction1!.transaction_date).toBeInstanceOf(Date);
    expect(transaction1!.created_at).toBeInstanceOf(Date);
    
    // Check second transaction
    const transaction2 = transactions.find(t => t.quantity === 5);
    expect(transaction2).toBeDefined();
    expect(transaction2!.product_sku).toEqual('TEST-001');
    expect(transaction2!.transaction_type).toEqual('stock-out');
    expect(transaction2!.quantity).toEqual(5);
    expect(transaction2!.id).toBeDefined();
    expect(transaction2!.transaction_date).toBeInstanceOf(Date);
    expect(transaction2!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no transactions exist', async () => {
    // Clear transactions table
    await db.delete(transactionsTable).execute();
    
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(0);
    expect(transactions).toEqual([]);
  });

  it('should properly map database fields to schema fields', async () => {
    const transactions = await getTransactions();
    
    const transaction = transactions[0];
    
    // Verify all fields are present and of correct types
    expect(typeof transaction.id).toBe('number');
    expect(typeof transaction.product_sku).toBe('string');
    expect(['stock-in', 'stock-out']).toContain(transaction.transaction_type);
    expect(typeof transaction.quantity).toBe('number');
    expect(transaction.transaction_date).toBeInstanceOf(Date);
    expect(transaction.created_at).toBeInstanceOf(Date);
  });
});
