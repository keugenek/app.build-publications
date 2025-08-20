import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { getBudgets } from '../handlers/get_budgets';

// Test setup data
const createTestCategory = async (name: string, isPredefined = false) => {
  const result = await db.insert(categoriesTable)
    .values({
      name,
      is_predefined: isPredefined
    })
    .returning()
    .execute();
  return result[0];
};

const createTestBudget = async (categoryId: number, monthlyLimit: number, month: number, year: number) => {
  const result = await db.insert(budgetsTable)
    .values({
      category_id: categoryId,
      monthly_limit: monthlyLimit.toString(),
      month,
      year
    })
    .returning()
    .execute();
  return result[0];
};

describe('getBudgets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return budgets for current month when no filters provided', async () => {
    // Create test category
    const category = await createTestCategory('Food', true);

    // Create budget for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    await createTestBudget(category.id, 500.00, currentMonth, currentYear);

    const results = await getBudgets();

    expect(results).toHaveLength(1);
    expect(results[0].category_id).toEqual(category.id);
    expect(results[0].monthly_limit).toEqual(500.00);
    expect(results[0].month).toEqual(currentMonth);
    expect(results[0].year).toEqual(currentYear);
    expect(typeof results[0].monthly_limit).toBe('number');
  });

  it('should return budgets filtered by specific month and year', async () => {
    // Create test categories
    const foodCategory = await createTestCategory('Food', true);
    const transportCategory = await createTestCategory('Transport', true);

    // Create budgets for different months
    await createTestBudget(foodCategory.id, 500.00, 3, 2024); // March 2024
    await createTestBudget(transportCategory.id, 200.00, 3, 2024); // March 2024
    await createTestBudget(foodCategory.id, 600.00, 4, 2024); // April 2024

    const results = await getBudgets(3, 2024);

    expect(results).toHaveLength(2);
    expect(results.every(budget => budget.month === 3 && budget.year === 2024)).toBe(true);
    
    // Check that both categories are represented
    const categoryIds = results.map(budget => budget.category_id);
    expect(categoryIds).toContain(foodCategory.id);
    expect(categoryIds).toContain(transportCategory.id);
  });

  it('should return empty array when no budgets exist for specified month', async () => {
    // Create test category and budget for different month
    const category = await createTestCategory('Food', true);
    await createTestBudget(category.id, 500.00, 6, 2024); // June 2024

    const results = await getBudgets(12, 2024); // December 2024

    expect(results).toHaveLength(0);
  });

  it('should handle budgets with different monthly limits correctly', async () => {
    // Create test categories
    const category1 = await createTestCategory('Food', true);
    const category2 = await createTestCategory('Transport', true);

    // Create budgets with different amounts
    await createTestBudget(category1.id, 1500.75, 5, 2024);
    await createTestBudget(category2.id, 250.25, 5, 2024);

    const results = await getBudgets(5, 2024);

    expect(results).toHaveLength(2);
    
    // Verify numeric conversion and precision
    const limits = results.map(budget => budget.monthly_limit).sort((a, b) => a - b);
    expect(limits[0]).toEqual(250.25);
    expect(limits[1]).toEqual(1500.75);
    expect(typeof limits[0]).toBe('number');
    expect(typeof limits[1]).toBe('number');
  });

  it('should only return budgets that have valid category references', async () => {
    // Create test category
    const category = await createTestCategory('Housing', true);
    
    // Create budget
    await createTestBudget(category.id, 800.00, 7, 2024);

    const results = await getBudgets(7, 2024);

    expect(results).toHaveLength(1);
    expect(results[0].category_id).toEqual(category.id);
    expect(results[0].monthly_limit).toEqual(800.00);
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle year filtering correctly', async () => {
    // Create test category
    const category = await createTestCategory('Entertainment', true);

    // Create budgets for same month but different years
    await createTestBudget(category.id, 300.00, 8, 2023);
    await createTestBudget(category.id, 350.00, 8, 2024);

    const results2023 = await getBudgets(8, 2023);
    const results2024 = await getBudgets(8, 2024);

    expect(results2023).toHaveLength(1);
    expect(results2024).toHaveLength(1);
    expect(results2023[0].year).toEqual(2023);
    expect(results2024[0].year).toEqual(2024);
    expect(results2023[0].monthly_limit).toEqual(300.00);
    expect(results2024[0].monthly_limit).toEqual(350.00);
  });
});
