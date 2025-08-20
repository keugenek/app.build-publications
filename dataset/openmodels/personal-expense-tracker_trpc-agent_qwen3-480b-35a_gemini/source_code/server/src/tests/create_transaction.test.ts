import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateTransactionInput = {
  amount: 150.75,
  date: new Date('2023-12-01'),
  description: 'Grocery shopping',
  type: 'expense',
  category: 'Food'
};

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction', async () => {
    const result = await createTransaction(testInput);

    // Basic field validation
    expect(result.amount).toEqual(150.75);
    expect(result.date).toEqual(new Date('2023-12-01'));
    expect(result.description).toEqual('Grocery shopping');
    expect(result.type).toEqual('expense');
    expect(result.category).toEqual('Food');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(testInput);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(parseFloat(transactions[0].amount)).toEqual(150.75);
    expect(new Date(transactions[0].date)).toEqual(new Date('2023-12-01'));
    expect(transactions[0].description).toEqual('Grocery shopping');
    expect(transactions[0].type).toEqual('expense');
    expect(transactions[0].category).toEqual('Food');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle income transaction type', async () => {
    const incomeInput: CreateTransactionInput = {
      amount: 2500.00,
      date: new Date('2023-12-05'),
      description: 'Monthly salary',
      type: 'income',
      category: 'Salary'
    };

    const result = await createTransaction(incomeInput);

    expect(result.type).toEqual('income');
    expect(result.category).toEqual('Salary');
    expect(result.amount).toEqual(2500.00);
  });

  it('should handle nullable description', async () => {
    const inputWithoutDescription: CreateTransactionInput = {
      amount: 75.50,
      date: new Date('2023-12-10'),
      description: null,
      type: 'expense',
      category: 'Transport'
    };

    const result = await createTransaction(inputWithoutDescription);

    expect(result.description).toBeNull();
    expect(result.amount).toEqual(75.50);
    expect(result.category).toEqual('Transport');
  });
});
