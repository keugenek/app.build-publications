import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { getStockTransactions } from '../handlers/get_stock_transactions';
import { eq } from 'drizzle-orm';

describe('getStockTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST-001',
        stock_quantity: 50
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;
    
    // Create some test transactions
    await db.insert(stockTransactionsTable)
      .values([
        {
          product_id: productId,
          transaction_type: 'IN',
          quantity: 10,
          notes: 'Initial stock'
        },
        {
          product_id: productId,
          transaction_type: 'OUT',
          quantity: 5,
          notes: 'Sold items'
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should retrieve all stock transactions', async () => {
    const transactions = await getStockTransactions();
    
    expect(transactions).toHaveLength(2);
    
    // Check that all required fields are present
    const firstTransaction = transactions[0];
    expect(firstTransaction.id).toBeDefined();
    expect(firstTransaction.product_id).toBeDefined();
    expect(firstTransaction.transaction_type).toBeDefined();
    expect(['IN', 'OUT']).toContain(firstTransaction.transaction_type);
    expect(firstTransaction.quantity).toBeDefined();
    expect(firstTransaction.created_at).toBeInstanceOf(Date);
    
    // Verify transactions are properly sorted (newest first)
    expect(transactions[0].created_at.getTime()).toBeGreaterThanOrEqual(
      transactions[1].created_at.getTime()
    );
  });

  it('should return an empty array when no transactions exist', async () => {
    // Clear all transactions
    await db.delete(stockTransactionsTable).execute();
    
    const transactions = await getStockTransactions();
    
    expect(transactions).toHaveLength(0);
  });

  it('should handle transactions with null notes', async () => {
    // Create a transaction with null notes
    const product = await db.select().from(productsTable).limit(1).execute();
    await db.insert(stockTransactionsTable)
      .values({
        product_id: product[0].id,
        transaction_type: 'IN',
        quantity: 15,
        notes: null
      })
      .execute();
    
    const transactions = await getStockTransactions();
    
    // Find the transaction with null notes
    const transactionWithNullNotes = transactions.find(t => t.quantity === 15);
    expect(transactionWithNullNotes).toBeDefined();
    expect(transactionWithNullNotes!.notes).toBeNull();
  });
});
