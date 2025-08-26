import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an income transaction without category', async () => {
    const testInput: CreateTransactionInput = {
      type: 'income',
      amount: 1500.50,
      description: 'Salary payment',
      date: new Date('2024-01-15'),
      category_id: null
    };

    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.type).toEqual('income');
    expect(result.amount).toEqual(1500.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Salary payment');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.category_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an expense transaction with category', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const testInput: CreateTransactionInput = {
      type: 'expense',
      amount: 25.99,
      description: 'Coffee shop visit',
      date: new Date('2024-01-16'),
      category_id: categoryId
    };

    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.type).toEqual('expense');
    expect(result.amount).toEqual(25.99);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Coffee shop visit');
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.category_id).toEqual(categoryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const testInput: CreateTransactionInput = {
      type: 'expense',
      amount: 99.99,
      description: 'Grocery shopping',
      date: new Date('2024-01-17'),
      category_id: null
    };

    const result = await createTransaction(testInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toEqual('expense');
    expect(parseFloat(transactions[0].amount)).toEqual(99.99);
    expect(transactions[0].description).toEqual('Grocery shopping');
    expect(transactions[0].date).toEqual(new Date('2024-01-17'));
    expect(transactions[0].category_id).toBeNull();
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle large amounts correctly', async () => {
    const testInput: CreateTransactionInput = {
      type: 'income',
      amount: 999999.99,
      description: 'Large bonus payment',
      date: new Date('2024-01-18'),
      category_id: null
    };

    const result = await createTransaction(testInput);

    expect(result.amount).toEqual(999999.99);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(transactions[0].amount)).toEqual(999999.99);
  });

  it('should throw error when category_id does not exist', async () => {
    const testInput: CreateTransactionInput = {
      type: 'expense',
      amount: 50.00,
      description: 'Test transaction',
      date: new Date('2024-01-19'),
      category_id: 999999 // Non-existent category ID
    };

    await expect(createTransaction(testInput))
      .rejects.toThrow(/Category with id 999999 does not exist/i);
  });

  it('should create multiple transactions with different types', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Food Category',
        is_predefined: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const incomeInput: CreateTransactionInput = {
      type: 'income',
      amount: 2000.00,
      description: 'Monthly salary',
      date: new Date('2024-01-01'),
      category_id: null
    };

    const expenseInput: CreateTransactionInput = {
      type: 'expense',
      amount: 120.50,
      description: 'Restaurant dinner',
      date: new Date('2024-01-02'),
      category_id: categoryId
    };

    const incomeResult = await createTransaction(incomeInput);
    const expenseResult = await createTransaction(expenseInput);

    expect(incomeResult.type).toEqual('income');
    expect(incomeResult.amount).toEqual(2000.00);
    expect(incomeResult.category_id).toBeNull();

    expect(expenseResult.type).toEqual('expense');
    expect(expenseResult.amount).toEqual(120.50);
    expect(expenseResult.category_id).toEqual(categoryId);

    // Verify both are in database
    const allTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(allTransactions).toHaveLength(2);
    
    const incomeTransaction = allTransactions.find(t => t.type === 'income');
    const expenseTransaction = allTransactions.find(t => t.type === 'expense');

    expect(incomeTransaction).toBeDefined();
    expect(expenseTransaction).toBeDefined();
    expect(parseFloat(incomeTransaction!.amount)).toEqual(2000.00);
    expect(parseFloat(expenseTransaction!.amount)).toEqual(120.50);
  });
});
