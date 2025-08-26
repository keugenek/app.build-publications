import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test category
  const createTestCategory = async () => {
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    return category[0];
  };

  // Helper to create test transaction
  const createTestTransaction = async (categoryId: number) => {
    const transactionInput: CreateTransactionInput = {
      amount: 50.00,
      description: 'Test transaction',
      type: 'expense',
      category_id: categoryId,
      transaction_date: new Date('2024-01-15')
    };

    const transaction = await db.insert(transactionsTable)
      .values({
        amount: transactionInput.amount.toString(),
        description: transactionInput.description,
        type: transactionInput.type,
        category_id: transactionInput.category_id,
        transaction_date: transactionInput.transaction_date
      })
      .returning()
      .execute();
    
    return transaction[0];
  };

  it('should successfully delete an existing transaction', async () => {
    // Create test data
    const category = await createTestCategory();
    const transaction = await createTestTransaction(category.id);

    // Delete the transaction
    const result = await deleteTransaction(transaction.id);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify transaction was actually removed from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transaction.id))
      .execute();

    expect(transactions).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent transaction', async () => {
    // Try to delete a transaction that doesn't exist
    const result = await deleteTransaction(99999);

    // Should return false for non-existent transaction
    expect(result.success).toBe(false);
  });

  it('should not affect other transactions when deleting one', async () => {
    // Create test data
    const category = await createTestCategory();
    const transaction1 = await createTestTransaction(category.id);
    const transaction2 = await createTestTransaction(category.id);

    // Delete only one transaction
    const result = await deleteTransaction(transaction1.id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify only the target transaction was deleted
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(remainingTransactions).toHaveLength(1);
    expect(remainingTransactions[0].id).toEqual(transaction2.id);
    expect(remainingTransactions[0].description).toEqual('Test transaction');
  });

  it('should handle multiple delete operations correctly', async () => {
    // Create test data
    const category = await createTestCategory();
    const transaction1 = await createTestTransaction(category.id);
    const transaction2 = await createTestTransaction(category.id);

    // Delete first transaction
    const result1 = await deleteTransaction(transaction1.id);
    expect(result1.success).toBe(true);

    // Delete second transaction
    const result2 = await deleteTransaction(transaction2.id);
    expect(result2.success).toBe(true);

    // Verify both transactions are gone
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(remainingTransactions).toHaveLength(0);
  });

  it('should return false when trying to delete already deleted transaction', async () => {
    // Create and delete a transaction
    const category = await createTestCategory();
    const transaction = await createTestTransaction(category.id);

    // First deletion should succeed
    const result1 = await deleteTransaction(transaction.id);
    expect(result1.success).toBe(true);

    // Second deletion attempt should return false
    const result2 = await deleteTransaction(transaction.id);
    expect(result2.success).toBe(false);
  });
});
