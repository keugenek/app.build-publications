import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test category for foreign key relationship
const testCategory = {
  name: 'Test Category',
  description: 'Category for testing'
};

// Simple test input for income transaction
const testIncomeInput: CreateTransactionInput = {
  description: 'Salary payment',
  amount: 5000.50,
  type: 'income' as const,
  category_id: null,
  transaction_date: new Date('2024-01-15')
};

// Test input for expense transaction with category
const testExpenseInput: CreateTransactionInput = {
  description: 'Grocery shopping',
  amount: 125.75,
  type: 'expense' as const,
  category_id: 1, // Will be set after creating test category
  transaction_date: new Date('2024-01-16')
};

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an income transaction without category', async () => {
    const result = await createTransaction(testIncomeInput);

    // Basic field validation
    expect(result.description).toEqual('Salary payment');
    expect(result.amount).toEqual(5000.50);
    expect(typeof result.amount).toEqual('number');
    expect(result.type).toEqual('income');
    expect(result.category_id).toBeNull();
    expect(result.transaction_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an expense transaction with category', async () => {
    // First create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const expenseInputWithValidCategory = {
      ...testExpenseInput,
      category_id: categoryResult[0].id
    };

    const result = await createTransaction(expenseInputWithValidCategory);

    // Basic field validation
    expect(result.description).toEqual('Grocery shopping');
    expect(result.amount).toEqual(125.75);
    expect(typeof result.amount).toEqual('number');
    expect(result.type).toEqual('expense');
    expect(result.category_id).toEqual(categoryResult[0].id);
    expect(result.transaction_date).toEqual(new Date('2024-01-16'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(testIncomeInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].description).toEqual('Salary payment');
    expect(parseFloat(transactions[0].amount)).toEqual(5000.50);
    expect(transactions[0].type).toEqual('income');
    expect(transactions[0].category_id).toBeNull();
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateTransactionInput = {
      description: 'Precise amount test',
      amount: 123.99,
      type: 'expense' as const,
      category_id: null,
      transaction_date: new Date('2024-01-17')
    };

    const result = await createTransaction(precisionInput);

    expect(result.amount).toEqual(123.99);
    expect(typeof result.amount).toEqual('number');

    // Verify database storage preserves precision
    const dbRecord = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(dbRecord[0].amount)).toEqual(123.99);
  });

  it('should throw error for non-existent category', async () => {
    const invalidCategoryInput: CreateTransactionInput = {
      description: 'Invalid category test',
      amount: 100.00,
      type: 'expense' as const,
      category_id: 999, // Non-existent category ID
      transaction_date: new Date('2024-01-18')
    };

    await expect(createTransaction(invalidCategoryInput)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should allow null category_id', async () => {
    const nullCategoryInput: CreateTransactionInput = {
      description: 'No category transaction',
      amount: 250.00,
      type: 'income' as const,
      category_id: null,
      transaction_date: new Date('2024-01-19')
    };

    const result = await createTransaction(nullCategoryInput);

    expect(result.category_id).toBeNull();
    expect(result.description).toEqual('No category transaction');
    expect(result.amount).toEqual(250.00);
  });

  it('should handle different transaction types correctly', async () => {
    // Test both income and expense types
    const incomeResult = await createTransaction({
      ...testIncomeInput,
      description: 'Test income'
    });

    const expenseResult = await createTransaction({
      description: 'Test expense',
      amount: 50.25,
      type: 'expense' as const,
      category_id: null,
      transaction_date: new Date('2024-01-20')
    });

    expect(incomeResult.type).toEqual('income');
    expect(expenseResult.type).toEqual('expense');

    // Verify both are saved correctly
    const allTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(allTransactions).toHaveLength(2);
    expect(allTransactions.some(t => t.type === 'income')).toBe(true);
    expect(allTransactions.some(t => t.type === 'expense')).toBe(true);
  });

  it('should preserve transaction date correctly', async () => {
    const specificDate = new Date('2024-06-15T10:30:00Z');
    const dateInput: CreateTransactionInput = {
      description: 'Date test transaction',
      amount: 75.00,
      type: 'expense' as const,
      category_id: null,
      transaction_date: specificDate
    };

    const result = await createTransaction(dateInput);

    expect(result.transaction_date).toEqual(specificDate);

    // Verify in database
    const dbRecord = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(dbRecord[0].transaction_date).toEqual(specificDate);
  });
});
