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
    // Create a test category first since transactions require a valid category_id
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF5733'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;
  });

  it('should create an income transaction', async () => {
    const testInput: CreateTransactionInput = {
      amount: 500.75,
      description: 'Salary payment',
      type: 'income',
      category_id: testCategoryId,
      transaction_date: new Date('2024-01-15')
    };

    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.amount).toEqual(500.75);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Salary payment');
    expect(result.type).toEqual('income');
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.transaction_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an expense transaction', async () => {
    const testInput: CreateTransactionInput = {
      amount: 29.99,
      description: 'Grocery shopping',
      type: 'expense',
      category_id: testCategoryId,
      transaction_date: new Date('2024-01-16')
    };

    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.amount).toEqual(29.99);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Grocery shopping');
    expect(result.type).toEqual('expense');
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.transaction_date).toEqual(new Date('2024-01-16'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const testInput: CreateTransactionInput = {
      amount: 150.00,
      description: 'Utilities payment',
      type: 'expense',
      category_id: testCategoryId,
      transaction_date: new Date('2024-01-20')
    };

    const result = await createTransaction(testInput);

    // Query the database to verify the transaction was saved
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(parseFloat(transactions[0].amount)).toEqual(150.00);
    expect(transactions[0].description).toEqual('Utilities payment');
    expect(transactions[0].type).toEqual('expense');
    expect(transactions[0].category_id).toEqual(testCategoryId);
    expect(transactions[0].transaction_date).toEqual(new Date('2024-01-20'));
    expect(transactions[0].created_at).toBeInstanceOf(Date);
    expect(transactions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const testInput: CreateTransactionInput = {
      amount: 123.45,
      description: 'Test decimal amount',
      type: 'income',
      category_id: testCategoryId,
      transaction_date: new Date('2024-01-25')
    };

    const result = await createTransaction(testInput);

    // Verify decimal precision is maintained
    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const savedTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(savedTransaction[0].amount)).toEqual(123.45);
  });

  it('should create transaction with valid timestamp fields', async () => {
    const testInput: CreateTransactionInput = {
      amount: 75.50,
      description: 'Timestamp test transaction',
      type: 'expense',
      category_id: testCategoryId,
      transaction_date: new Date('2024-02-15T14:30:00Z')
    };

    const result = await createTransaction(testInput);

    // Verify timestamp fields are properly set
    expect(result.transaction_date).toEqual(new Date('2024-02-15T14:30:00Z'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });

  it('should create multiple transactions with different dates', async () => {
    const transactions = [
      {
        amount: 100.00,
        description: 'Transaction 1',
        type: 'income' as const,
        category_id: testCategoryId,
        transaction_date: new Date('2024-01-01')
      },
      {
        amount: 200.50,
        description: 'Transaction 2',
        type: 'expense' as const,
        category_id: testCategoryId,
        transaction_date: new Date('2024-01-02')
      },
      {
        amount: 75.25,
        description: 'Transaction 3',
        type: 'income' as const,
        category_id: testCategoryId,
        transaction_date: new Date('2024-01-03')
      }
    ];

    const results = await Promise.all(
      transactions.map(tx => createTransaction(tx))
    );

    // Verify all transactions were created
    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.amount).toEqual(transactions[index].amount);
      expect(result.description).toEqual(transactions[index].description);
      expect(result.type).toEqual(transactions[index].type);
      expect(result.transaction_date).toEqual(transactions[index].transaction_date);
      expect(result.id).toBeDefined();
    });

    // Verify all are saved in database
    const allTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(allTransactions.length).toBeGreaterThanOrEqual(3);
  });
});
