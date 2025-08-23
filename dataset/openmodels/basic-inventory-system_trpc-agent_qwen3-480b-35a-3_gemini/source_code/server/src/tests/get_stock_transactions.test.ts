import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockTransactionsTable } from '../db/schema';
import { getStockTransactions } from '../handlers/get_stock_transactions';
import { eq } from 'drizzle-orm';

describe('getStockTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product first (required for foreign key constraint)
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'TEST123',
        stockLevel: 10
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;
    
    // Create test transactions
    await db.insert(stockTransactionsTable)
      .values([
        {
          productId,
          quantity: 5,
          transactionType: 'STOCK_IN',
        },
        {
          productId,
          quantity: 3,
          transactionType: 'STOCK_OUT',
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should return all stock transactions', async () => {
    const transactions = await getStockTransactions();
    
    expect(transactions).toHaveLength(2);
    
    // Check first transaction
    expect(transactions[0]).toMatchObject({
      productId: expect.any(Number),
      quantity: 5,
      transactionType: 'STOCK_IN',
      transactionDate: expect.any(Date)
    });
    
    // Check second transaction
    expect(transactions[1]).toMatchObject({
      productId: expect.any(Number),
      quantity: 3,
      transactionType: 'STOCK_OUT',
      transactionDate: expect.any(Date)
    });
  });

  it('should return empty array when no transactions exist', async () => {
    // Clear all transactions
    await db.delete(stockTransactionsTable).execute();
    
    const transactions = await getStockTransactions();
    
    expect(transactions).toHaveLength(0);
  });

  it('should return transactions with correct data types', async () => {
    const transactions = await getStockTransactions();
    
    expect(transactions).toHaveLength(2);
    
    transactions.forEach(transaction => {
      expect(typeof transaction.id).toBe('number');
      expect(typeof transaction.productId).toBe('number');
      expect(typeof transaction.quantity).toBe('number');
      expect(transaction.transactionType).toMatch(/^(STOCK_IN|STOCK_OUT)$/);
      expect(transaction.transactionDate).toBeInstanceOf(Date);
    });
  });
});
