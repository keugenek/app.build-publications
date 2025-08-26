import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput, type CreateCategoryInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

// Test data setup
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF0000'
};

const testTransaction1: CreateTransactionInput = {
  amount: 100.50,
  date: new Date('2024-01-15'),
  description: 'Grocery shopping',
  type: 'expense',
  category_id: 1
};

const testTransaction2: CreateTransactionInput = {
  amount: 2500.00,
  date: new Date('2024-01-10'),
  description: 'Salary payment',
  type: 'income',
  category_id: 1
};

const testTransaction3: CreateTransactionInput = {
  amount: 50.25,
  date: new Date('2024-01-20'),
  description: 'Gas station',
  type: 'expense',
  category_id: 1
};

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all transactions with correct data types', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test transaction
    await db.insert(transactionsTable)
      .values({
        amount: testTransaction1.amount.toString(),
        date: testTransaction1.date,
        description: testTransaction1.description,
        type: testTransaction1.type,
        category_id: categoryId
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    
    const transaction = result[0];
    expect(transaction.amount).toEqual(100.50);
    expect(typeof transaction.amount).toBe('number'); // Verify numeric conversion
    expect(transaction.date).toBeInstanceOf(Date);
    expect(transaction.description).toEqual('Grocery shopping');
    expect(transaction.type).toEqual('expense');
    expect(transaction.category_id).toEqual(categoryId);
    expect(transaction.id).toBeDefined();
    expect(transaction.created_at).toBeInstanceOf(Date);
  });

  it('should return transactions ordered by date (most recent first)', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple transactions with different dates
    await db.insert(transactionsTable)
      .values([
        {
          ...testTransaction1,
          amount: testTransaction1.amount.toString(),
          category_id: categoryId
        },
        {
          ...testTransaction2,
          amount: testTransaction2.amount.toString(),
          category_id: categoryId
        },
        {
          ...testTransaction3,
          amount: testTransaction3.amount.toString(),
          category_id: categoryId
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].date).toEqual(new Date('2024-01-20')); // Most recent
    expect(result[0].description).toEqual('Gas station');
    expect(result[0].amount).toEqual(50.25);
    
    expect(result[1].date).toEqual(new Date('2024-01-15')); // Middle
    expect(result[1].description).toEqual('Grocery shopping');
    expect(result[1].amount).toEqual(100.50);
    
    expect(result[2].date).toEqual(new Date('2024-01-10')); // Oldest
    expect(result[2].description).toEqual('Salary payment');
    expect(result[2].amount).toEqual(2500.00);
  });

  it('should handle both income and expense transaction types', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create both income and expense transactions
    await db.insert(transactionsTable)
      .values([
        {
          ...testTransaction1, // expense
          amount: testTransaction1.amount.toString(),
          category_id: categoryId
        },
        {
          ...testTransaction2, // income
          amount: testTransaction2.amount.toString(),
          category_id: categoryId
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    // Find transactions by type
    const incomeTransaction = result.find(t => t.type === 'income');
    const expenseTransaction = result.find(t => t.type === 'expense');

    expect(incomeTransaction).toBeDefined();
    expect(incomeTransaction!.amount).toEqual(2500.00);
    expect(incomeTransaction!.description).toEqual('Salary payment');

    expect(expenseTransaction).toBeDefined();
    expect(expenseTransaction!.amount).toEqual(100.50);
    expect(expenseTransaction!.description).toEqual('Grocery shopping');
  });

  it('should handle decimal amounts correctly', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create transaction with decimal amount
    const decimalTransaction = {
      amount: 99.99,
      date: new Date('2024-01-15'),
      description: 'Test decimal amount',
      type: 'expense' as const,
      category_id: categoryId
    };

    await db.insert(transactionsTable)
      .values({
        ...decimalTransaction,
        amount: decimalTransaction.amount.toString()
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(99.99);
    expect(typeof result[0].amount).toBe('number');
  });
});
