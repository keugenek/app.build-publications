import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing transaction and return true', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    // Create a test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        type: 'expense',
        amount: '25.50',
        description: 'Test transaction',
        date: new Date('2024-01-15'),
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Delete the transaction
    const result = await deleteTransaction(transactionId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify transaction was actually deleted from database
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(remainingTransactions).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent transaction', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent transaction
    const result = await deleteTransaction(nonExistentId);

    // Should return false indicating no transaction was found/deleted
    expect(result).toBe(false);
  });

  it('should delete transaction without category and return true', async () => {
    // Create a test transaction without category
    const transactionResult = await db.insert(transactionsTable)
      .values({
        type: 'income',
        amount: '100.00',
        description: 'Test income without category',
        date: new Date('2024-01-20'),
        category_id: null
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Delete the transaction
    const result = await deleteTransaction(transactionId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify transaction was actually deleted from database
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(remainingTransactions).toHaveLength(0);
  });

  it('should not affect other transactions when deleting one', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    // Create multiple test transactions
    const transaction1Result = await db.insert(transactionsTable)
      .values({
        type: 'expense',
        amount: '25.50',
        description: 'Transaction 1',
        date: new Date('2024-01-15'),
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const transaction2Result = await db.insert(transactionsTable)
      .values({
        type: 'income',
        amount: '50.00',
        description: 'Transaction 2',
        date: new Date('2024-01-16'),
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Delete only the first transaction
    const result = await deleteTransaction(transaction1Result[0].id);

    // Should return true
    expect(result).toBe(true);

    // Verify only the first transaction was deleted
    const transaction1Check = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transaction1Result[0].id))
      .execute();

    const transaction2Check = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transaction2Result[0].id))
      .execute();

    expect(transaction1Check).toHaveLength(0);
    expect(transaction2Check).toHaveLength(1);
    expect(transaction2Check[0].description).toEqual('Transaction 2');
  });

  it('should handle negative transaction IDs correctly', async () => {
    const negativeId = -1;

    // Attempt to delete with negative ID
    const result = await deleteTransaction(negativeId);

    // Should return false as no transaction with negative ID should exist
    expect(result).toBe(false);
  });
});
