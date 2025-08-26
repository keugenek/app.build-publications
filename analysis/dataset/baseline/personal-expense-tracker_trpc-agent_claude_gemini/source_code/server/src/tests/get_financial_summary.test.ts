import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type DateRange } from '../schema';
import { getFinancialSummary } from '../handlers/get_financial_summary';

describe('getFinancialSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no transactions exist', async () => {
    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(0);
    expect(result.total_expense).toEqual(0);
    expect(result.net_balance).toEqual(0);
    expect(result.start_date).toEqual(dateRange.start_date);
    expect(result.end_date).toEqual(dateRange.end_date);
  });

  it('should calculate summary correctly with income and expenses', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'For testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Salary',
          amount: '5000.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15')
        },
        {
          description: 'Freelance',
          amount: '1500.50',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-20')
        },
        {
          description: 'Rent',
          amount: '1200.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-01')
        },
        {
          description: 'Groceries',
          amount: '350.25',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-10')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(6500.5); // 5000 + 1500.5
    expect(result.total_expense).toEqual(1550.25); // 1200 + 350.25
    expect(result.net_balance).toEqual(4950.25); // 6500.5 - 1550.25
    expect(result.start_date).toEqual(dateRange.start_date);
    expect(result.end_date).toEqual(dateRange.end_date);
  });

  it('should filter transactions by date range correctly', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'For testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create transactions in different date ranges
    await db.insert(transactionsTable)
      .values([
        // Within date range
        {
          description: 'January Income',
          amount: '1000.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15')
        },
        {
          description: 'January Expense',
          amount: '200.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-20')
        },
        // Outside date range (should be excluded)
        {
          description: 'December Income',
          amount: '500.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2023-12-31')
        },
        {
          description: 'February Expense',
          amount: '300.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-02-01')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    // Should only include January transactions
    expect(result.total_income).toEqual(1000);
    expect(result.total_expense).toEqual(200);
    expect(result.net_balance).toEqual(800);
  });

  it('should handle only income transactions', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Income Category',
        description: 'For income testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create only income transactions
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Salary',
          amount: '3000.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-15')
        },
        {
          description: 'Bonus',
          amount: '1000.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: new Date('2024-01-25')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(4000);
    expect(result.total_expense).toEqual(0);
    expect(result.net_balance).toEqual(4000);
  });

  it('should handle only expense transactions', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Expense Category',
        description: 'For expense testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create only expense transactions
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Rent',
          amount: '1200.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-01')
        },
        {
          description: 'Utilities',
          amount: '150.75',
          type: 'expense',
          category_id: categoryId,
          transaction_date: new Date('2024-01-05')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(0);
    expect(result.total_expense).toEqual(1350.75);
    expect(result.net_balance).toEqual(-1350.75); // Negative balance
  });

  it('should handle transactions without categories', async () => {
    // Create transactions without category_id
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Cash Income',
          amount: '500.00',
          type: 'income',
          category_id: null,
          transaction_date: new Date('2024-01-10')
        },
        {
          description: 'Cash Expense',
          amount: '100.00',
          type: 'expense',
          category_id: null,
          transaction_date: new Date('2024-01-15')
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(500);
    expect(result.total_expense).toEqual(100);
    expect(result.net_balance).toEqual(400);
  });

  it('should handle edge case with same start and end date', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Single Day Category',
        description: 'For single day testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const targetDate = new Date('2024-01-15');

    // Create transactions on the target date
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Same Day Income',
          amount: '100.00',
          type: 'income',
          category_id: categoryId,
          transaction_date: targetDate
        },
        {
          description: 'Same Day Expense',
          amount: '50.00',
          type: 'expense',
          category_id: categoryId,
          transaction_date: targetDate
        }
      ])
      .execute();

    const dateRange: DateRange = {
      start_date: targetDate,
      end_date: targetDate
    };

    const result = await getFinancialSummary(dateRange);

    expect(result.total_income).toEqual(100);
    expect(result.total_expense).toEqual(50);
    expect(result.net_balance).toEqual(50);
  });
});
