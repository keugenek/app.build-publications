import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing transaction', async () => {
    // First, create a transaction to delete
    const transaction = await db.insert(transactionsTable)
      .values({
        amount: '100.00',
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD string
        description: 'Test transaction',
        type: 'income',
        category: 'Salary'
      })
      .returning()
      .execute();
    
    const transactionId = transaction[0].id;
    
    // Verify the transaction exists before deletion
    const beforeDeletion = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();
    
    expect(beforeDeletion).toHaveLength(1);
    
    // Delete the transaction
    const result = await deleteTransaction(transactionId);
    
    // Verify deletion was successful
    expect(result).toBe(true);
    
    // Verify the transaction no longer exists
    const afterDeletion = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();
    
    expect(afterDeletion).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent transaction', async () => {
    // Try to delete a transaction that doesn't exist
    const result = await deleteTransaction(999999);
    
    // Should return false since no transaction was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified transaction', async () => {
    // Create two transactions
    const transaction1 = await db.insert(transactionsTable)
      .values({
        amount: '50.00',
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD string
        description: 'Transaction 1',
        type: 'expense',
        category: 'Food'
      })
      .returning()
      .execute();
    
    const transaction2 = await db.insert(transactionsTable)
      .values({
        amount: '75.00',
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD string
        description: 'Transaction 2',
        type: 'expense',
        category: 'Transport'
      })
      .returning()
      .execute();
    
    const id1 = transaction1[0].id;
    const id2 = transaction2[0].id;
    
    // Verify both transactions exist
    const beforeDeletion = await db.select().from(transactionsTable).execute();
    expect(beforeDeletion).toHaveLength(2);
    
    // Delete only the first transaction
    const result = await deleteTransaction(id1);
    expect(result).toBe(true);
    
    // Verify only the first transaction was deleted
    const afterDeletion = await db.select().from(transactionsTable).execute();
    expect(afterDeletion).toHaveLength(1);
    expect(afterDeletion[0].id).toBe(id2);
  });
});
