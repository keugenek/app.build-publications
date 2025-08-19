import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, budgetsTable } from '../db/schema';
import { getBudgets } from '../handlers/get_budgets';

describe('getBudgets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test category
  const createTestCategory = async (name = 'Test Category') => {
    const result = await db.insert(categoriesTable)
      .values({
        name,
        description: 'Test category description'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test budget
  const createTestBudget = async (categoryId: number, amount = 500.00, month = 1, year = 2024) => {
    const result = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        amount: amount.toString(), // Convert to string for numeric column
        month,
        year
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return all budgets when no filters provided', async () => {
    // Create test data
    const category1 = await createTestCategory('Food');
    const category2 = await createTestCategory('Transport');
    
    await createTestBudget(category1.id, 600.00, 1, 2024);
    await createTestBudget(category2.id, 400.50, 2, 2024);
    await createTestBudget(category1.id, 650.75, 3, 2023);

    const results = await getBudgets();

    expect(results).toHaveLength(3);
    
    // Check that amounts are properly converted to numbers
    results.forEach(budget => {
      expect(typeof budget.amount).toBe('number');
      expect(budget.id).toBeDefined();
      expect(budget.category_id).toBeDefined();
      expect(budget.month).toBeDefined();
      expect(budget.year).toBeDefined();
      expect(budget.created_at).toBeInstanceOf(Date);
      expect(budget.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific amounts
    const amounts = results.map(b => b.amount).sort();
    expect(amounts).toEqual([400.5, 600, 650.75]);
  });

  it('should filter budgets by month only', async () => {
    const category = await createTestCategory('Entertainment');
    
    await createTestBudget(category.id, 300.00, 1, 2024);
    await createTestBudget(category.id, 350.00, 2, 2024);
    await createTestBudget(category.id, 275.25, 1, 2023); // Same month, different year

    const results = await getBudgets(1); // Filter by month 1

    expect(results).toHaveLength(2);
    results.forEach(budget => {
      expect(budget.month).toBe(1);
      expect(typeof budget.amount).toBe('number');
    });

    const amounts = results.map(b => b.amount).sort();
    expect(amounts).toEqual([275.25, 300]);
  });

  it('should filter budgets by year only', async () => {
    const category = await createTestCategory('Utilities');
    
    await createTestBudget(category.id, 200.00, 1, 2024);
    await createTestBudget(category.id, 220.50, 3, 2024);
    await createTestBudget(category.id, 180.75, 5, 2023);

    const results = await getBudgets(undefined, 2024);

    expect(results).toHaveLength(2);
    results.forEach(budget => {
      expect(budget.year).toBe(2024);
      expect(typeof budget.amount).toBe('number');
    });

    const amounts = results.map(b => b.amount).sort();
    expect(amounts).toEqual([200, 220.5]);
  });

  it('should filter budgets by both month and year', async () => {
    const category1 = await createTestCategory('Groceries');
    const category2 = await createTestCategory('Gas');
    
    await createTestBudget(category1.id, 800.00, 6, 2024);
    await createTestBudget(category2.id, 150.75, 6, 2024);
    await createTestBudget(category1.id, 750.00, 6, 2023); // Same month, different year
    await createTestBudget(category1.id, 820.50, 7, 2024); // Same year, different month

    const results = await getBudgets(6, 2024);

    expect(results).toHaveLength(2);
    results.forEach(budget => {
      expect(budget.month).toBe(6);
      expect(budget.year).toBe(2024);
      expect(typeof budget.amount).toBe('number');
    });

    const amounts = results.map(b => b.amount).sort();
    expect(amounts).toEqual([150.75, 800]);
  });

  it('should return empty array when no budgets match filters', async () => {
    const category = await createTestCategory('Shopping');
    
    await createTestBudget(category.id, 400.00, 3, 2024);
    await createTestBudget(category.id, 450.25, 4, 2023);

    // Filter for a month/year combination that doesn't exist
    const results = await getBudgets(12, 2025);

    expect(results).toHaveLength(0);
  });

  it('should handle edge case month and year values correctly', async () => {
    const category = await createTestCategory('Miscellaneous');
    
    // Test edge months and years
    await createTestBudget(category.id, 100.00, 1, 2000); // Min month, early year
    await createTestBudget(category.id, 200.50, 12, 2050); // Max month, future year

    // Test minimum month
    let results = await getBudgets(1);
    expect(results).toHaveLength(1);
    expect(results[0].month).toBe(1);
    expect(results[0].amount).toBe(100);

    // Test maximum month
    results = await getBudgets(12);
    expect(results).toHaveLength(1);
    expect(results[0].month).toBe(12);
    expect(results[0].amount).toBe(200.5);

    // Test specific year
    results = await getBudgets(undefined, 2000);
    expect(results).toHaveLength(1);
    expect(results[0].year).toBe(2000);
  });

  it('should handle decimal amounts correctly', async () => {
    const category = await createTestCategory('Precision Test');
    
    // Test various decimal amounts
    await createTestBudget(category.id, 123.45, 1, 2024);
    await createTestBudget(category.id, 999.99, 2, 2024);
    await createTestBudget(category.id, 0.01, 3, 2024); // Minimum positive amount

    const results = await getBudgets(undefined, 2024);

    expect(results).toHaveLength(3);
    
    // Check precise decimal conversion
    const amounts = results.map(b => b.amount).sort();
    expect(amounts).toEqual([0.01, 123.45, 999.99]);

    // Verify all are proper numbers
    results.forEach(budget => {
      expect(typeof budget.amount).toBe('number');
      expect(Number.isFinite(budget.amount)).toBe(true);
    });
  });
});
