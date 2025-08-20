import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type UpdateTransactionInput, type CreateCategoryInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

// Test category
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF0000'
};

// Another test category for category updates
const anotherCategory: CreateCategoryInput = {
  name: 'Another Category',
  color: '#00FF00'
};

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update transaction amount', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create initial transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '50.00',
        date: new Date('2024-01-01'),
        description: 'Original Transaction',
        type: 'expense',
        category_id: category.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Update transaction amount
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      amount: 75.50
    };

    const result = await updateTransaction(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(originalTransaction.id);
    expect(result.amount).toEqual(75.50);
    expect(typeof result.amount).toBe('number');
    
    // Verify unchanged fields
    expect(result.date).toEqual(originalTransaction.date);
    expect(result.description).toEqual('Original Transaction');
    expect(result.type).toEqual('expense');
    expect(result.category_id).toEqual(category.id);
  });

  it('should update multiple transaction fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create initial transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '100.00',
        date: new Date('2024-01-01'),
        description: 'Original Transaction',
        type: 'expense',
        category_id: category.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Update multiple fields
    const newDate = new Date('2024-02-15');
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      amount: 150.75,
      date: newDate,
      description: 'Updated Transaction',
      type: 'income'
    };

    const result = await updateTransaction(updateInput);

    // Verify all updated fields
    expect(result.id).toEqual(originalTransaction.id);
    expect(result.amount).toEqual(150.75);
    expect(result.date).toEqual(newDate);
    expect(result.description).toEqual('Updated Transaction');
    expect(result.type).toEqual('income');
    expect(result.category_id).toEqual(category.id); // Unchanged
  });

  it('should update transaction category', async () => {
    // Create two categories
    const category1Result = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category1 = category1Result[0];

    const category2Result = await db.insert(categoriesTable)
      .values(anotherCategory)
      .returning()
      .execute();
    const category2 = category2Result[0];

    // Create transaction with first category
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '25.00',
        date: new Date('2024-01-01'),
        description: 'Test Transaction',
        type: 'expense',
        category_id: category1.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Update to second category
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      category_id: category2.id
    };

    const result = await updateTransaction(updateInput);

    // Verify category was updated
    expect(result.category_id).toEqual(category2.id);
    
    // Verify other fields unchanged
    expect(result.amount).toEqual(25.00);
    expect(result.description).toEqual('Test Transaction');
    expect(result.type).toEqual('expense');
  });

  it('should save updated transaction to database', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create initial transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '30.00',
        date: new Date('2024-01-01'),
        description: 'Original Transaction',
        type: 'expense',
        category_id: category.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Update transaction
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      amount: 45.25,
      description: 'Updated in Database'
    };

    await updateTransaction(updateInput);

    // Query database to verify changes were saved
    const updatedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, originalTransaction.id))
      .execute();

    expect(updatedTransactions).toHaveLength(1);
    const savedTransaction = updatedTransactions[0];
    expect(parseFloat(savedTransaction.amount)).toEqual(45.25);
    expect(savedTransaction.description).toEqual('Updated in Database');
  });

  it('should throw error when transaction does not exist', async () => {
    const updateInput: UpdateTransactionInput = {
      id: 99999, // Non-existent ID
      amount: 100.00
    };

    await expect(updateTransaction(updateInput)).rejects.toThrow(/transaction with id 99999 not found/i);
  });

  it('should throw error when category does not exist', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create initial transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '50.00',
        date: new Date('2024-01-01'),
        description: 'Test Transaction',
        type: 'expense',
        category_id: category.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Try to update with non-existent category
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      category_id: 99999 // Non-existent category ID
    };

    await expect(updateTransaction(updateInput)).rejects.toThrow(/category with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create initial transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        amount: '20.00',
        date: new Date('2024-01-01'),
        description: 'Original Transaction',
        type: 'expense',
        category_id: category.id
      })
      .returning()
      .execute();
    const originalTransaction = transactionResult[0];

    // Update only description
    const updateInput: UpdateTransactionInput = {
      id: originalTransaction.id,
      description: 'Only Description Changed'
    };

    const result = await updateTransaction(updateInput);

    // Verify only description changed
    expect(result.description).toEqual('Only Description Changed');
    expect(result.amount).toEqual(20.00);
    expect(result.date).toEqual(originalTransaction.date);
    expect(result.type).toEqual('expense');
    expect(result.category_id).toEqual(category.id);
  });
});
