import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing transaction', async () => {
    // Create a test category first (required for foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '100.50',
        date: new Date('2024-01-15'),
        description: 'Test transaction',
        type: 'expense',
        category_id: categoryId
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Delete the transaction
    const result = await deleteTransaction(transactionId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify transaction no longer exists in database
    const deletedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(deletedTransactions).toHaveLength(0);
  });

  it('should throw error when transaction does not exist', async () => {
    const nonExistentId = 99999;

    await expect(deleteTransaction(nonExistentId))
      .rejects.toThrow(/Transaction with id 99999 not found/i);
  });

  it('should verify transaction exists before deletion', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create and immediately delete a transaction to get a valid but non-existent ID
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '50.00',
        date: new Date('2024-01-15'),
        description: 'Test transaction',
        type: 'income',
        category_id: categoryId
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;

    // Delete it manually to simulate non-existent transaction
    await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    // Now try to delete it again via handler - should throw error
    await expect(deleteTransaction(transactionId))
      .rejects.toThrow(/Transaction with id .* not found/i);
  });

  it('should handle multiple transactions correctly', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#00FF00'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple transactions
    const transaction1Result = await db.insert(transactionsTable)
      .values({
        amount: '25.00',
        date: new Date('2024-01-10'),
        description: 'Transaction 1',
        type: 'expense',
        category_id: categoryId
      })
      .returning()
      .execute();

    const transaction2Result = await db.insert(transactionsTable)
      .values({
        amount: '75.00',
        date: new Date('2024-01-12'),
        description: 'Transaction 2',
        type: 'income',
        category_id: categoryId
      })
      .returning()
      .execute();

    const transactionId1 = transaction1Result[0].id;
    const transactionId2 = transaction2Result[0].id;

    // Delete only the first transaction
    const result = await deleteTransaction(transactionId1);
    expect(result.success).toBe(true);

    // Verify only the first transaction was deleted
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(remainingTransactions).toHaveLength(1);
    expect(remainingTransactions[0].id).toBe(transactionId2);
    expect(remainingTransactions[0].description).toBe('Transaction 2');
  });

  it('should handle deletion of transactions with different types', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Mixed Category',
        color: '#0000FF'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create income transaction
    const incomeResult = await db.insert(transactionsTable)
      .values({
        amount: '500.00',
        date: new Date('2024-01-01'),
        description: 'Income transaction',
        type: 'income',
        category_id: categoryId
      })
      .returning()
      .execute();

    // Create expense transaction
    const expenseResult = await db.insert(transactionsTable)
      .values({
        amount: '200.00',
        date: new Date('2024-01-02'),
        description: 'Expense transaction',
        type: 'expense',
        category_id: categoryId
      })
      .returning()
      .execute();

    // Delete the income transaction
    const result1 = await deleteTransaction(incomeResult[0].id);
    expect(result1.success).toBe(true);

    // Delete the expense transaction
    const result2 = await deleteTransaction(expenseResult[0].id);
    expect(result2.success).toBe(true);

    // Verify both transactions are deleted
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(remainingTransactions).toHaveLength(0);
  });
});
