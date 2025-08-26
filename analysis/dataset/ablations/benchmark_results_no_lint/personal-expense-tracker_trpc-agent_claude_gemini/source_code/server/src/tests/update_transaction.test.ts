import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type UpdateTransactionInput, type CreateCategoryInput, type CreateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCategoryId: number;
  let testTransactionId: number;
  let secondCategoryId: number;

  beforeEach(async () => {
    // Create test categories
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        color: '#FF5733'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    const secondCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Transportation',
        color: '#33C3FF'
      })
      .returning()
      .execute();
    secondCategoryId = secondCategoryResult[0].id;

    // Create test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '50.00',
        description: 'Grocery shopping',
        type: 'expense',
        category_id: testCategoryId,
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    testTransactionId = transactionResult[0].id;
  });

  it('should update transaction amount', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      amount: 75.50
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.amount).toEqual(75.50);
    expect(typeof result.amount).toEqual('number');
    expect(result.description).toEqual('Grocery shopping'); // Should remain unchanged
    expect(result.type).toEqual('expense'); // Should remain unchanged
    expect(result.category_id).toEqual(testCategoryId); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction description', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      description: 'Updated grocery shopping'
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.description).toEqual('Updated grocery shopping');
    expect(result.amount).toEqual(50); // Should remain unchanged
    expect(result.type).toEqual('expense'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction type', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      type: 'income'
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.type).toEqual('income');
    expect(result.amount).toEqual(50); // Should remain unchanged
    expect(result.description).toEqual('Grocery shopping'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction category_id', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      category_id: secondCategoryId
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.category_id).toEqual(secondCategoryId);
    expect(result.amount).toEqual(50); // Should remain unchanged
    expect(result.description).toEqual('Grocery shopping'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction date', async () => {
    const newDate = new Date('2024-02-20');
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      transaction_date: newDate
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.transaction_date).toEqual(newDate);
    expect(result.amount).toEqual(50); // Should remain unchanged
    expect(result.description).toEqual('Grocery shopping'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const newDate = new Date('2024-03-10');
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      amount: 120.75,
      description: 'Weekly grocery shopping',
      type: 'income',
      category_id: secondCategoryId,
      transaction_date: newDate
    };

    const result = await updateTransaction(updateInput);

    expect(result.id).toEqual(testTransactionId);
    expect(result.amount).toEqual(120.75);
    expect(typeof result.amount).toEqual('number');
    expect(result.description).toEqual('Weekly grocery shopping');
    expect(result.type).toEqual('income');
    expect(result.category_id).toEqual(secondCategoryId);
    expect(result.transaction_date).toEqual(newDate);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      amount: 99.99,
      description: 'Updated description'
    };

    await updateTransaction(updateInput);

    // Query database to verify changes were persisted
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, testTransactionId))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(parseFloat(transactions[0].amount)).toEqual(99.99);
    expect(transactions[0].description).toEqual('Updated description');
    expect(transactions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent transaction', async () => {
    const updateInput: UpdateTransactionInput = {
      id: 99999,
      amount: 100
    };

    await expect(updateTransaction(updateInput)).rejects.toThrow(/transaction with id 99999 not found/i);
  });

  it('should throw error for non-existent category', async () => {
    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      category_id: 99999
    };

    await expect(updateTransaction(updateInput)).rejects.toThrow(/category with id 99999 not found/i);
  });

  it('should update only specified fields', async () => {
    const originalTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, testTransactionId))
      .execute();

    const updateInput: UpdateTransactionInput = {
      id: testTransactionId,
      amount: 200
    };

    const result = await updateTransaction(updateInput);

    // Only amount should change, everything else should remain the same
    expect(result.amount).toEqual(200);
    expect(result.description).toEqual(originalTransaction[0].description);
    expect(result.type).toEqual(originalTransaction[0].type);
    expect(result.category_id).toEqual(originalTransaction[0].category_id);
    expect(result.transaction_date).toEqual(originalTransaction[0].transaction_date);
    expect(result.created_at).toEqual(originalTransaction[0].created_at);
    // updated_at should be different
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTransaction[0].updated_at.getTime());
  });
});
