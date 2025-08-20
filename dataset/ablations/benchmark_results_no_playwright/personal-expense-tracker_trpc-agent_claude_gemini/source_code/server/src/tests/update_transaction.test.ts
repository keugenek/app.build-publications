import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type UpdateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCategoryId: number;
  let testTransactionId: number;
  let alternativeCategoryId: number;

  beforeEach(async () => {
    // Create test categories
    const categoryResults = await db.insert(categoriesTable)
      .values([
        { name: 'Test Category', is_predefined: false },
        { name: 'Alternative Category', is_predefined: false }
      ])
      .returning()
      .execute();
    
    testCategoryId = categoryResults[0].id;
    alternativeCategoryId = categoryResults[1].id;

    // Create test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        type: 'expense',
        amount: '50.00',
        description: 'Original transaction',
        date: new Date('2024-01-15'),
        category_id: testCategoryId
      })
      .returning()
      .execute();
    
    testTransactionId = transactionResult[0].id;
  });

  it('should update transaction type', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      type: 'income'
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.type).toEqual('income');
    expect(result.amount).toEqual(50.00); // Should remain unchanged
    expect(result.description).toEqual('Original transaction'); // Should remain unchanged
  });

  it('should update transaction amount', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      amount: 75.50
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.amount).toEqual(75.50);
    expect(typeof result.amount).toEqual('number');
    expect(result.type).toEqual('expense'); // Should remain unchanged
  });

  it('should update transaction description', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      description: 'Updated transaction description'
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.description).toEqual('Updated transaction description');
    expect(result.amount).toEqual(50.00); // Should remain unchanged
  });

  it('should update transaction date', async () => {
    const newDate = new Date('2024-02-20');
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      date: newDate
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.date).toEqual(newDate);
  });

  it('should update transaction category', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      category_id: alternativeCategoryId
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.category_id).toEqual(alternativeCategoryId);
  });

  it('should set category to null', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      category_id: null
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.category_id).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const newDate = new Date('2024-03-10');
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      type: 'income',
      amount: 125.75,
      description: 'Fully updated transaction',
      date: newDate,
      category_id: alternativeCategoryId
    };

    const result = await updateTransaction(input);

    expect(result.id).toEqual(testTransactionId);
    expect(result.type).toEqual('income');
    expect(result.amount).toEqual(125.75);
    expect(result.description).toEqual('Fully updated transaction');
    expect(result.date).toEqual(newDate);
    expect(result.category_id).toEqual(alternativeCategoryId);
  });

  it('should persist changes to database', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      type: 'income',
      amount: 200.00,
      description: 'Database persistence test'
    };

    await updateTransaction(input);

    // Query database directly to verify persistence
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, testTransactionId))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toEqual('income');
    expect(parseFloat(transactions[0].amount)).toEqual(200.00);
    expect(transactions[0].description).toEqual('Database persistence test');
  });

  it('should throw error for non-existent transaction', async () => {
    const input: UpdateTransactionInput = {
      id: 99999,
      amount: 100.00
    };

    await expect(updateTransaction(input)).rejects.toThrow(/transaction not found/i);
  });

  it('should throw error for non-existent category', async () => {
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      category_id: 99999
    };

    await expect(updateTransaction(input)).rejects.toThrow(/category not found/i);
  });

  it('should handle partial updates without affecting other fields', async () => {
    // First, get the original transaction data
    const originalTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, testTransactionId))
      .execute();

    // Update only the description
    const input: UpdateTransactionInput = {
      id: testTransactionId,
      description: 'Only description changed'
    };

    const result = await updateTransaction(input);

    // Verify only description changed
    expect(result.description).toEqual('Only description changed');
    expect(result.type).toEqual(originalTransaction[0].type);
    expect(result.amount).toEqual(parseFloat(originalTransaction[0].amount));
    expect(result.category_id).toEqual(originalTransaction[0].category_id);
    expect(result.date).toEqual(originalTransaction[0].date);
  });
});
