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

  let testCategoryId: number;

  beforeEach(async () => {
    // Create a test category first (required for foreign key)
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#ff0000'
      })
      .returning()
      .execute();
    
    testCategoryId = categories[0].id;
  });

  const createTestInput = (overrides: Partial<CreateTransactionInput> = {}): CreateTransactionInput => ({
    amount: 50.75,
    date: new Date('2024-01-15'),
    description: 'Test transaction',
    type: 'expense' as const,
    category_id: testCategoryId,
    ...overrides
  });

  it('should create an expense transaction', async () => {
    const testInput = createTestInput();
    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.amount).toEqual(50.75);
    expect(result.date).toEqual(testInput.date);
    expect(result.description).toEqual('Test transaction');
    expect(result.type).toEqual('expense');
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.amount).toBe('number');
  });

  it('should create an income transaction', async () => {
    const testInput = createTestInput({
      type: 'income',
      description: 'Salary payment',
      amount: 2500.00
    });
    
    const result = await createTransaction(testInput);

    expect(result.type).toEqual('income');
    expect(result.description).toEqual('Salary payment');
    expect(result.amount).toEqual(2500.00);
    expect(typeof result.amount).toBe('number');
  });

  it('should save transaction to database', async () => {
    const testInput = createTestInput();
    const result = await createTransaction(testInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const savedTransaction = transactions[0];
    expect(savedTransaction.description).toEqual('Test transaction');
    expect(parseFloat(savedTransaction.amount)).toEqual(50.75);
    expect(savedTransaction.type).toEqual('expense');
    expect(savedTransaction.category_id).toEqual(testCategoryId);
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const testInput = createTestInput({
      amount: 123.456789 // Test precision handling
    });
    
    const result = await createTransaction(testInput);

    expect(result.amount).toEqual(123.456789);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(transactions[0].amount)).toEqual(123.456789);
  });

  it('should handle large amounts', async () => {
    const testInput = createTestInput({
      amount: 99999999.99
    });
    
    const result = await createTransaction(testInput);

    expect(result.amount).toEqual(99999999.99);
    expect(typeof result.amount).toBe('number');
  });

  it('should throw error for non-existent category', async () => {
    const testInput = createTestInput({
      category_id: 99999 // Non-existent category ID
    });

    await expect(createTransaction(testInput))
      .rejects.toThrow(/Category with id 99999 does not exist/i);
  });

  it('should handle different transaction types', async () => {
    // Test both enum values
    const expenseInput = createTestInput({ type: 'expense' });
    const incomeInput = createTestInput({ type: 'income', amount: 1000.50 });

    const expenseResult = await createTransaction(expenseInput);
    const incomeResult = await createTransaction(incomeInput);

    expect(expenseResult.type).toEqual('expense');
    expect(incomeResult.type).toEqual('income');
    expect(incomeResult.amount).toEqual(1000.50);
  });

  it('should preserve date information accurately', async () => {
    const specificDate = new Date('2024-12-25T10:30:00.000Z');
    const testInput = createTestInput({
      date: specificDate
    });
    
    const result = await createTransaction(testInput);

    expect(result.date).toEqual(specificDate);
    
    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions[0].date).toEqual(specificDate);
  });

  it('should create multiple transactions with same category', async () => {
    const input1 = createTestInput({ description: 'First transaction', amount: 100.00 });
    const input2 = createTestInput({ description: 'Second transaction', amount: 200.00 });

    const result1 = await createTransaction(input1);
    const result2 = await createTransaction(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.category_id).toEqual(result2.category_id);
    expect(result1.description).toEqual('First transaction');
    expect(result2.description).toEqual('Second transaction');
    expect(result1.amount).toEqual(100.00);
    expect(result2.amount).toEqual(200.00);
  });
});
