import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type DateRange } from '../schema';
import { getSpendingTrends } from '../handlers/get_spending_trends';

describe('getSpendingTrends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toEqual([]);
  });

  it('should aggregate daily spending data correctly', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test transactions for different dates
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Income 1',
          amount: '100.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T10:00:00Z')
        },
        {
          description: 'Expense 1',
          amount: '50.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T14:00:00Z')
        },
        {
          description: 'Income 2',
          amount: '200.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-16T09:00:00Z')
        },
        {
          description: 'Expense 2',
          amount: '75.50',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-16T16:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(2);

    // Check first day (2024-01-15)
    const day1 = result.find(r => r.date === '2024-01-15');
    expect(day1).toBeDefined();
    expect(day1?.total_income).toBe(100);
    expect(day1?.total_expense).toBe(50);
    expect(day1?.net_amount).toBe(50);

    // Check second day (2024-01-16)
    const day2 = result.find(r => r.date === '2024-01-16');
    expect(day2).toBeDefined();
    expect(day2?.total_income).toBe(200);
    expect(day2?.total_expense).toBe(75.5);
    expect(day2?.net_amount).toBe(124.5);
  });

  it('should filter by date range correctly', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create transactions across different dates
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Before range',
          amount: '100.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2023-12-31T10:00:00Z')
        },
        {
          description: 'In range',
          amount: '50.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T14:00:00Z')
        },
        {
          description: 'After range',
          amount: '200.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-02-01T09:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].total_income).toBe(0);
    expect(result[0].total_expense).toBe(50);
    expect(result[0].net_amount).toBe(-50);
  });

  it('should handle transactions without categories', async () => {
    // Create transactions without category_id
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Uncategorized Income',
          amount: '150.00',
          type: 'income',
          category_id: null,
          transaction_date: new Date('2024-01-20T10:00:00Z')
        },
        {
          description: 'Uncategorized Expense',
          amount: '80.25',
          type: 'expense',
          category_id: null,
          transaction_date: new Date('2024-01-20T15:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-20');
    expect(result[0].total_income).toBe(150);
    expect(result[0].total_expense).toBe(80.25);
    expect(result[0].net_amount).toBe(69.75);
  });

  it('should return results in chronological order', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create transactions in reverse chronological order
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Later transaction',
          amount: '100.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-20T10:00:00Z')
        },
        {
          description: 'Earlier transaction',
          amount: '50.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-10T14:00:00Z')
        },
        {
          description: 'Middle transaction',
          amount: '75.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T09:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2024-01-10');
    expect(result[1].date).toBe('2024-01-15');
    expect(result[2].date).toBe('2024-01-20');
  });

  it('should handle multiple transactions on same date', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create multiple transactions on the same date
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Income 1',
          amount: '100.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T08:00:00Z')
        },
        {
          description: 'Income 2',
          amount: '50.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T12:00:00Z')
        },
        {
          description: 'Expense 1',
          amount: '30.25',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T14:00:00Z')
        },
        {
          description: 'Expense 2',
          amount: '20.75',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T18:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].total_income).toBe(150);
    expect(result[0].total_expense).toBe(51);
    expect(result[0].net_amount).toBe(99);
  });

  it('should handle edge cases with decimal amounts', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test' })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create transactions with precise decimal amounts
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Precise Income',
          amount: '123.45',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T10:00:00Z')
        },
        {
          description: 'Precise Expense',
          amount: '67.89',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15T14:00:00Z')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getSpendingTrends(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].total_income).toBe(123.45);
    expect(result[0].total_expense).toBe(67.89);
    expect(result[0].net_amount).toBe(55.56);
    expect(typeof result[0].total_income).toBe('number');
    expect(typeof result[0].total_expense).toBe('number');
    expect(typeof result[0].net_amount).toBe('number');
  });
});
