import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable, transactionsTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test items first (needed for foreign key constraint)
    const items = await db.insert(itemsTable)
      .values([
        { name: 'Test Item 1', code: 'TI001', description: 'Test item 1 description' },
        { name: 'Test Item 2', code: 'TI002', description: 'Test item 2 description' }
      ])
      .returning()
      .execute();
    
    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        { item_id: items[0].id, type: 'in', quantity: 10 },
        { item_id: items[0].id, type: 'out', quantity: 5 },
        { item_id: items[1].id, type: 'in', quantity: 20 }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should fetch all transactions', async () => {
    const transactions = await getTransactions();

    expect(transactions).toHaveLength(3);
    
    // Check that all required fields are present
    transactions.forEach(transaction => {
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('item_id');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('quantity');
      expect(transaction).toHaveProperty('created_at');
      
      // Verify types
      expect(typeof transaction.id).toBe('number');
      expect(typeof transaction.item_id).toBe('number');
      expect(['in', 'out']).toContain(transaction.type);
      expect(typeof transaction.quantity).toBe('number');
      expect(transaction.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return transactions with correct data', async () => {
    const transactions = await getTransactions();

    // Find the specific transactions we created
    const inTransaction = transactions.find(t => t.type === 'in' && t.quantity === 10);
    const outTransaction = transactions.find(t => t.type === 'out' && t.quantity === 5);
    const secondInTransaction = transactions.find(t => t.type === 'in' && t.quantity === 20);

    expect(inTransaction).toBeDefined();
    expect(outTransaction).toBeDefined();
    expect(secondInTransaction).toBeDefined();

    // Verify the item_id references
    if (inTransaction && outTransaction) {
      expect(inTransaction.item_id).toBe(outTransaction.item_id);
    }
    
    if (inTransaction && secondInTransaction) {
      expect(inTransaction.item_id).not.toBe(secondInTransaction.item_id);
    }
  });

  it('should return an empty array when no transactions exist', async () => {
    // Clear all transactions
    await db.delete(transactionsTable).execute();
    
    const transactions = await getTransactions();
    
    expect(transactions).toHaveLength(0);
    expect(transactions).toEqual([]);
  });

  it('should return transactions with proper ID types', async () => {
    const transactions = await getTransactions();
    
    // Verify that we have transactions
    expect(transactions.length).toBeGreaterThan(0);
    
    // Check that all IDs are defined and numeric
    transactions.forEach(transaction => {
      expect(transaction.id).toBeDefined();
      expect(typeof transaction.id).toBe('number');
    });
  });
});
