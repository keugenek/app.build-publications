// Tests for transaction handlers
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { createTransaction, getTransactions } from '../handlers/create_transaction';

// Helper to create a category directly in DB for tests
const createTestCategory = async (name: string) => {
  const result = await db
    .insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

const testInputBase: Omit<CreateTransactionInput, 'transaction_date'> = {
  amount: 150.75,
  type: 'income',
  category_id: 0, // will be set after creating category
  description: 'Salary for August',
};

describe('Transaction handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction with proper numeric conversion', async () => {
    const category = await createTestCategory('Salary');
    const input: CreateTransactionInput = { ...testInputBase, category_id: category.id };
    const result = await createTransaction(input);

    // Verify fields
    expect(result.id).toBeDefined();
    expect(result.amount).toBe(150.75);
    expect(typeof result.amount).toBe('number');
    expect(result.type).toBe('income');
    expect(result.category_id).toBe(category.id);
    expect(result.description).toBe('Salary for August');
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should retrieve transactions with numeric conversion', async () => {
    const category = await createTestCategory('Freelance');
    const input: CreateTransactionInput = {
      amount: 200.0,
      type: 'income',
      category_id: category.id,
      description: null,
    };
    const created = await createTransaction(input);

    const all = await getTransactions();
    // Should contain at least the one we just created
    const found = all.find((t) => t.id === created.id);
    expect(found).toBeDefined();
    expect(found?.amount).toBe(200.0);
    expect(typeof found?.amount).toBe('number');
  });

  it('should throw an error when creating a transaction with a non‑existent category', async () => {
    const invalidInput: CreateTransactionInput = {
      amount: 50,
      type: 'expense',
      category_id: 9999, // assuming this does not exist
      description: 'Invalid category test',
    };
    await expect(createTransaction(invalidInput)).rejects.toThrow(/Category with id 9999 does not exist/);
  });
});
