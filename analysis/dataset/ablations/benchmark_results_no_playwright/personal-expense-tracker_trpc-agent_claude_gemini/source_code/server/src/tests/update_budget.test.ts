import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type UpdateBudgetInput, type CreateBudgetInput } from '../schema';
import { updateBudget } from '../handlers/update_budget';
import { eq } from 'drizzle-orm';

describe('updateBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCategoryId: number;
  let testBudgetId: number;

  beforeEach(async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();
    
    testCategoryId = categoryResult[0].id;

    // Create test budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: testCategoryId,
        monthly_limit: '500.00',
        month: 6,
        year: 2024
      })
      .returning()
      .execute();

    testBudgetId = budgetResult[0].id;
  });

  it('should update budget monthly limit', async () => {
    const input: UpdateBudgetInput = {
      id: testBudgetId,
      monthly_limit: 750.50
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(testBudgetId);
    expect(result.monthly_limit).toEqual(750.50);
    expect(typeof result.monthly_limit).toBe('number');
    expect(result.month).toEqual(6); // Should remain unchanged
    expect(result.year).toEqual(2024); // Should remain unchanged
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update budget month and year', async () => {
    const input: UpdateBudgetInput = {
      id: testBudgetId,
      month: 12,
      year: 2025
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(testBudgetId);
    expect(result.month).toEqual(12);
    expect(result.year).toEqual(2025);
    expect(result.monthly_limit).toEqual(500); // Should remain unchanged
    expect(result.category_id).toEqual(testCategoryId);
  });

  it('should update all fields when provided', async () => {
    const input: UpdateBudgetInput = {
      id: testBudgetId,
      monthly_limit: 1200.25,
      month: 3,
      year: 2026
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(testBudgetId);
    expect(result.monthly_limit).toEqual(1200.25);
    expect(result.month).toEqual(3);
    expect(result.year).toEqual(2026);
    expect(result.category_id).toEqual(testCategoryId);
  });

  it('should save updated budget to database', async () => {
    const input: UpdateBudgetInput = {
      id: testBudgetId,
      monthly_limit: 999.99,
      month: 8
    };

    await updateBudget(input);

    // Verify changes are persisted
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, testBudgetId))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(parseFloat(budgets[0].monthly_limit)).toEqual(999.99);
    expect(budgets[0].month).toEqual(8);
    expect(budgets[0].year).toEqual(2024); // Should remain unchanged
    expect(budgets[0].category_id).toEqual(testCategoryId);
  });

  it('should throw error when budget does not exist', async () => {
    const input: UpdateBudgetInput = {
      id: 999999, // Non-existent ID
      monthly_limit: 100.00
    };

    await expect(updateBudget(input)).rejects.toThrow(/Budget with id 999999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Update only monthly_limit
    const input1: UpdateBudgetInput = {
      id: testBudgetId,
      monthly_limit: 333.33
    };

    const result1 = await updateBudget(input1);
    expect(result1.monthly_limit).toEqual(333.33);
    expect(result1.month).toEqual(6);
    expect(result1.year).toEqual(2024);

    // Update only month
    const input2: UpdateBudgetInput = {
      id: testBudgetId,
      month: 11
    };

    const result2 = await updateBudget(input2);
    expect(result2.monthly_limit).toEqual(333.33); // From previous update
    expect(result2.month).toEqual(11);
    expect(result2.year).toEqual(2024);
  });

  it('should handle decimal amounts correctly', async () => {
    const input: UpdateBudgetInput = {
      id: testBudgetId,
      monthly_limit: 1234.56
    };

    const result = await updateBudget(input);

    expect(result.monthly_limit).toEqual(1234.56);
    expect(typeof result.monthly_limit).toBe('number');

    // Verify in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, testBudgetId))
      .execute();

    expect(parseFloat(budgets[0].monthly_limit)).toEqual(1234.56);
  });
});
