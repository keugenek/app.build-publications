import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type UpdateTransactionInput } from '../schema';
import { createTransaction, getTransactions, updateTransaction } from '../handlers/transaction';
import { eq } from 'drizzle-orm';

// Helper to create a category for foreign key
const createTestCategory = async () => {
  const result = await db
    .insert(categoriesTable)
    .values({ name: 'Test Category' })
    .returning()
    .execute();
  return result[0];
};

describe('Transaction handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction with numeric conversion', async () => {
    const category = await createTestCategory();
    const input: CreateTransactionInput = {
      amount: 123.45,
      description: 'Test transaction',
      date: new Date('2023-01-01'),
      category_id: category.id,
      type: 'expense',
    };

    const result = await createTransaction(input);

    // Verify returned fields
    expect(result.id).toBeDefined();
    expect(result.amount).toBe(123.45);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toBe('Test transaction');
    expect(result.date).toEqual(new Date('2023-01-01'));
    expect(result.category_id).toBe(category.id);
    expect(result.type).toBe('expense');
  });

  it('should retrieve transactions from the database', async () => {
    const category = await createTestCategory();
    const input: CreateTransactionInput = {
      amount: 99.99,
      description: 'Another transaction',
      date: new Date('2023-02-02'),
      category_id: category.id,
      type: 'income',
    };
    const created = await createTransaction(input);

    const all = await getTransactions();
    // Find our transaction
    const found = all.find((t) => t.id === created.id);
    expect(found).toBeDefined();
    expect(found?.amount).toBe(99.99);
    expect(found?.type).toBe('income');
  });

  it('should update an existing transaction', async () => {
    const category = await createTestCategory();
    const input: CreateTransactionInput = {
      amount: 10,
      description: 'Initial',
      date: new Date('2023-03-03'),
      category_id: category.id,
      type: 'expense',
    };
    const created = await createTransaction(input);

    const updateInput: UpdateTransactionInput = {
      id: created.id,
      amount: 20.5,
      description: 'Updated',
      type: 'income',
    };

    const updated = await updateTransaction(updateInput);

    expect(updated.id).toBe(created.id);
    expect(updated.amount).toBe(20.5);
    expect(updated.description).toBe('Updated');
    expect(updated.type).toBe('income');

    // Ensure DB reflects changes
    const dbRow = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, created.id))
      .execute();
    expect(dbRow).toHaveLength(1);
    expect(parseFloat(dbRow[0].amount)).toBe(20.5);
    expect(dbRow[0].description).toBe('Updated');
    expect(dbRow[0].type).toBe('income');
  });
});
