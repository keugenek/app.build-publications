import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

// Test data
describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a product first (required for foreign key constraint)
    await db.insert(productsTable).values({
      name: 'Test Product',
      stock_quantity: 50
    }).returning();
  });
  
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all transactions from database', async () => {
    // Create test transactions directly
    const transaction1 = await db.insert(transactionsTable).values({
      product_id: 1,
      type: 'masuk',
      quantity: 10,
      transaction_date: new Date('2023-01-15').toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    }).returning();
    
    const transaction2 = await db.insert(transactionsTable).values({
      product_id: 1,
      type: 'keluar',
      quantity: 5,
      transaction_date: new Date('2023-01-15').toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    }).returning();

    // Fetch all transactions
    const result = await getTransactions();

    // Should return both transactions
    expect(result).toHaveLength(2);
    
    // Check first transaction
    expect(result[0].id).toEqual(transaction1[0].id);
    expect(result[0].product_id).toEqual(1);
    expect(result[0].type).toEqual('masuk');
    expect(result[0].quantity).toEqual(10);
    expect(result[0].transaction_date).toEqual(new Date('2023-01-15'));
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second transaction
    expect(result[1].id).toEqual(transaction2[0].id);
    expect(result[1].product_id).toEqual(1);
    expect(result[1].type).toEqual('keluar');
    expect(result[1].quantity).toEqual(5);
    expect(result[1].transaction_date).toEqual(new Date('2023-01-15'));
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return transactions ordered by creation date', async () => {
    // Create transactions
    await db.insert(transactionsTable).values({
      product_id: 1,
      type: 'masuk',
      quantity: 10,
      transaction_date: new Date('2023-01-15').toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    }).returning();
    
    // Small delay to ensure different creation timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(transactionsTable).values({
      product_id: 1,
      type: 'keluar',
      quantity: 20,
      transaction_date: new Date('2023-01-15').toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    }).returning();

    const result = await getTransactions();
    
    // Verify ordering by creation date
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(
      result[1].created_at.getTime()
    );
  });

  it('should handle transaction date conversion correctly', async () => {
    await db.insert(transactionsTable).values({
      product_id: 1,
      type: 'masuk',
      quantity: 10,
      transaction_date: new Date('2023-01-15').toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    }).returning();
    
    const result = await getTransactions();
    
    expect(result).toHaveLength(1);
    expect(result[0].transaction_date).toBeInstanceOf(Date);
    expect(result[0].transaction_date).toEqual(new Date('2023-01-15'));
  });
});