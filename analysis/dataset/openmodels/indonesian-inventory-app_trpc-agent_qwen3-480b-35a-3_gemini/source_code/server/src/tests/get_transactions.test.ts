import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        code: 'TEST001',
        name: 'Test Product',
        description: 'A product for testing',
        purchase_price: '10.99',
        selling_price: '19.99',
        stock_quantity: 100
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;
    
    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          product_id: productId,
          type: 'IN',
          quantity: 50,
          reference: 'REF001',
          notes: 'Test transaction 1'
        },
        {
          product_id: productId,
          type: 'OUT',
          quantity: 25,
          reference: 'REF002',
          notes: 'Test transaction 2'
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all transactions', async () => {
    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    // Check the first transaction
    expect(result[0].product_id).toBeDefined();
    expect(result[0].type).toEqual('IN');
    expect(result[0].quantity).toEqual(50);
    expect(result[0].reference).toEqual('REF001');
    expect(result[0].notes).toEqual('Test transaction 1');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check the second transaction
    expect(result[1].product_id).toBeDefined();
    expect(result[1].type).toEqual('OUT');
    expect(result[1].quantity).toEqual(25);
    expect(result[1].reference).toEqual('REF002');
    expect(result[1].notes).toEqual('Test transaction 2');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return transactions ordered by created_at', async () => {
    const result = await getTransactions();
    
    // Should be ordered by created_at ascending
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });

  it('should return an empty array when no transactions exist', async () => {
    // Clear transactions table
    await db.delete(transactionsTable).execute();
    
    const result = await getTransactions();
    
    expect(result).toHaveLength(0);
  });

  it('should fetch transactions from database correctly', async () => {
    const result = await getTransactions();

    // Query transactions directly from database
    const transactions = await db.select()
      .from(transactionsTable)
      .orderBy(transactionsTable.created_at)
      .execute();

    expect(result).toHaveLength(transactions.length);
    
    // Compare each transaction
    for (let i = 0; i < result.length; i++) {
      expect(result[i].id).toEqual(transactions[i].id);
      expect(result[i].product_id).toEqual(transactions[i].product_id);
      expect(result[i].type).toEqual(transactions[i].type);
      expect(result[i].quantity).toEqual(parseInt(transactions[i].quantity.toString()));
      expect(result[i].reference).toEqual(transactions[i].reference);
      expect(result[i].notes).toEqual(transactions[i].notes);
      expect(result[i].created_at).toEqual(transactions[i].created_at);
    }
  });
});
