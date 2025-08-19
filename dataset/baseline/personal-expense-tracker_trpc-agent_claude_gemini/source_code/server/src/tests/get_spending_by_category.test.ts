import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type DateRange } from '../schema';
import { getSpendingByCategory } from '../handlers/get_spending_by_category';

// Test data setup
const testCategories = [
  { name: 'Food', description: 'Food and dining expenses' },
  { name: 'Transport', description: 'Transportation costs' },
  { name: 'Entertainment', description: 'Entertainment and leisure' }
];

const testDateRange: DateRange = {
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('getSpendingByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expense transactions exist', async () => {
    const result = await getSpendingByCategory(testDateRange);
    expect(result).toEqual([]);
  });

  it('should aggregate spending by category correctly', async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values(testCategories)
      .returning()
      .execute();

    const foodCategory = categories.find(c => c.name === 'Food')!;
    const transportCategory = categories.find(c => c.name === 'Transport')!;

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Grocery shopping',
          amount: '50.00',
          type: 'expense',
          category_id: foodCategory.id,
          transaction_date: new Date('2024-01-15')
        },
        {
          description: 'Restaurant dinner',
          amount: '75.50',
          type: 'expense',
          category_id: foodCategory.id,
          transaction_date: new Date('2024-01-20')
        },
        {
          description: 'Bus fare',
          amount: '15.25',
          type: 'expense',
          category_id: transportCategory.id,
          transaction_date: new Date('2024-01-10')
        }
      ])
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    // Should be ordered by total amount descending
    expect(result).toHaveLength(2);
    
    // Food category should be first (highest spending)
    expect(result[0].category_id).toEqual(foodCategory.id);
    expect(result[0].category_name).toEqual('Food');
    expect(result[0].total_amount).toEqual(125.50); // 50.00 + 75.50
    expect(result[0].transaction_count).toEqual(2);

    // Transport category should be second
    expect(result[1].category_id).toEqual(transportCategory.id);
    expect(result[1].category_name).toEqual('Transport');
    expect(result[1].total_amount).toEqual(15.25);
    expect(result[1].transaction_count).toEqual(1);
  });

  it('should include uncategorized transactions', async () => {
    // Create transaction without category
    await db.insert(transactionsTable)
      .values({
        description: 'Miscellaneous expense',
        amount: '25.00',
        type: 'expense',
        category_id: null,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    expect(result).toHaveLength(1);
    expect(result[0].category_id).toBeNull();
    expect(result[0].category_name).toBeNull();
    expect(result[0].total_amount).toEqual(25.00);
    expect(result[0].transaction_count).toEqual(1);
  });

  it('should only include expense transactions, not income', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({ name: 'Salary', description: 'Income from work' })
      .returning()
      .execute();

    // Create both income and expense transactions
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Monthly salary',
          amount: '3000.00',
          type: 'income',
          category_id: category.id,
          transaction_date: new Date('2024-01-01')
        },
        {
          description: 'Office supplies',
          amount: '100.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2024-01-15')
        }
      ])
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    // Should only include expense transaction
    expect(result).toHaveLength(1);
    expect(result[0].total_amount).toEqual(100.00);
    expect(result[0].transaction_count).toEqual(1);
  });

  it('should filter by date range correctly', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({ name: 'Food', description: 'Food expenses' })
      .returning()
      .execute();

    // Create transactions - some within range, some outside
    await db.insert(transactionsTable)
      .values([
        {
          description: 'December expense',
          amount: '50.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2023-12-31') // Before range
        },
        {
          description: 'January expense',
          amount: '75.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2024-01-15') // Within range
        },
        {
          description: 'February expense',
          amount: '100.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2024-02-01') // After range
        }
      ])
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    // Should only include January transaction
    expect(result).toHaveLength(1);
    expect(result[0].total_amount).toEqual(75.00);
    expect(result[0].transaction_count).toEqual(1);
  });

  it('should handle edge dates correctly', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({ name: 'Food', description: 'Food expenses' })
      .returning()
      .execute();

    // Create transactions on exact boundary dates
    await db.insert(transactionsTable)
      .values([
        {
          description: 'Start date transaction',
          amount: '30.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2024-01-01') // Exact start date
        },
        {
          description: 'End date transaction',
          amount: '40.00',
          type: 'expense',
          category_id: category.id,
          transaction_date: new Date('2024-01-31') // Exact end date
        }
      ])
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    // Should include both boundary transactions
    expect(result).toHaveLength(1);
    expect(result[0].total_amount).toEqual(70.00); // 30.00 + 40.00
    expect(result[0].transaction_count).toEqual(2);
  });

  it('should verify numeric type conversions', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({ name: 'Food', description: 'Food expenses' })
      .returning()
      .execute();

    // Create transaction with decimal amount
    await db.insert(transactionsTable)
      .values({
        description: 'Test expense',
        amount: '123.45',
        type: 'expense',
        category_id: category.id,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const result = await getSpendingByCategory(testDateRange);

    expect(result).toHaveLength(1);
    // Verify numeric types
    expect(typeof result[0].total_amount).toBe('number');
    expect(typeof result[0].transaction_count).toBe('number');
    expect(result[0].total_amount).toEqual(123.45);
  });
});
