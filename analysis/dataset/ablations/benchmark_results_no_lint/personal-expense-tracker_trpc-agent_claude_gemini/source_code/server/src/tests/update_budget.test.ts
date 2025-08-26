import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type UpdateBudgetInput } from '../schema';
import { updateBudget } from '../handlers/update_budget';
import { eq } from 'drizzle-orm';

describe('updateBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let budgetId: number;

  // Helper to create test data
  const createTestData = async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    categoryId = categoryResult[0].id;

    // Create a test budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();
    
    budgetId = budgetResult[0].id;
  };

  it('should update monthly_limit only', async () => {
    await createTestData();

    const input: UpdateBudgetInput = {
      id: budgetId,
      monthly_limit: 750.50
    };

    const result = await updateBudget(input);

    expect(result.id).toBe(budgetId);
    expect(result.monthly_limit).toBe(750.50);
    expect(result.category_id).toBe(categoryId);
    expect(result.month).toBe(3);
    expect(result.year).toBe(2024);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.monthly_limit).toBe('number');
  });

  it('should update month and year', async () => {
    await createTestData();

    const input: UpdateBudgetInput = {
      id: budgetId,
      month: 6,
      year: 2025
    };

    const result = await updateBudget(input);

    expect(result.id).toBe(budgetId);
    expect(result.month).toBe(6);
    expect(result.year).toBe(2025);
    expect(result.monthly_limit).toBe(500); // Should remain unchanged
    expect(result.category_id).toBe(categoryId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update all fields', async () => {
    await createTestData();

    const input: UpdateBudgetInput = {
      id: budgetId,
      monthly_limit: 1200.75,
      month: 12,
      year: 2025
    };

    const result = await updateBudget(input);

    expect(result.id).toBe(budgetId);
    expect(result.monthly_limit).toBe(1200.75);
    expect(result.month).toBe(12);
    expect(result.year).toBe(2025);
    expect(result.category_id).toBe(categoryId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    await createTestData();

    const input: UpdateBudgetInput = {
      id: budgetId,
      monthly_limit: 999.99,
      month: 8,
      year: 2026
    };

    await updateBudget(input);

    // Verify the changes were persisted to database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(budgets).toHaveLength(1);
    const budget = budgets[0];
    expect(parseFloat(budget.monthly_limit)).toBe(999.99);
    expect(budget.month).toBe(8);
    expect(budget.year).toBe(2026);
    expect(budget.updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    await createTestData();

    // Get original budget
    const originalBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();
    const originalUpdatedAt = originalBudgets[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateBudgetInput = {
      id: budgetId,
      monthly_limit: 600.00
    };

    const result = await updateBudget(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent budget', async () => {
    const input: UpdateBudgetInput = {
      id: 999999,
      monthly_limit: 500.00
    };

    await expect(updateBudget(input)).rejects.toThrow(/Budget with id 999999 not found/);
  });

  it('should handle partial updates correctly', async () => {
    await createTestData();

    // Update only month
    const monthInput: UpdateBudgetInput = {
      id: budgetId,
      month: 7
    };

    const monthResult = await updateBudget(monthInput);

    expect(monthResult.month).toBe(7);
    expect(monthResult.year).toBe(2024); // Should remain unchanged
    expect(monthResult.monthly_limit).toBe(500); // Should remain unchanged

    // Update only year
    const yearInput: UpdateBudgetInput = {
      id: budgetId,
      year: 2027
    };

    const yearResult = await updateBudget(yearInput);

    expect(yearResult.year).toBe(2027);
    expect(yearResult.month).toBe(7); // Should be from previous update
    expect(yearResult.monthly_limit).toBe(500); // Should remain unchanged
  });

  it('should handle decimal amounts correctly', async () => {
    await createTestData();

    const input: UpdateBudgetInput = {
      id: budgetId,
      monthly_limit: 1234.56
    };

    const result = await updateBudget(input);

    expect(result.monthly_limit).toBe(1234.56);
    expect(typeof result.monthly_limit).toBe('number');

    // Verify in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(parseFloat(budgets[0].monthly_limit)).toBe(1234.56);
  });
});
