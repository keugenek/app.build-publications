import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateBudgetInput } from '../schema';
import { deleteBudget } from '../handlers/delete_budget';
import { eq } from 'drizzle-orm';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF5733'
};

const testBudget: CreateBudgetInput = {
  category_id: 1, // Will be set after category creation
  monthly_limit: 500.00,
  month: 3,
  year: 2024
};

describe('deleteBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing budget', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    // Create budget to delete
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: categoryResult[0].id,
        monthly_limit: testBudget.monthly_limit.toString(),
        month: testBudget.month,
        year: testBudget.year
      })
      .returning()
      .execute();

    const budgetId = budgetResult[0].id;

    // Delete the budget
    const result = await deleteBudget(budgetId);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify budget no longer exists in database
    const remainingBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(remainingBudgets).toHaveLength(0);
  });

  it('should return false for non-existent budget', async () => {
    // Try to delete budget that doesn't exist
    const result = await deleteBudget(9999);

    // Should return false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other budgets when deleting', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();

    // Create multiple budgets
    const budget1 = await db.insert(budgetsTable)
      .values({
        category_id: categoryResult[0].id,
        monthly_limit: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budget2 = await db.insert(budgetsTable)
      .values({
        category_id: categoryResult[0].id,
        monthly_limit: '750.00',
        month: 4,
        year: 2024
      })
      .returning()
      .execute();

    // Delete first budget
    const result = await deleteBudget(budget1[0].id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify only the first budget was deleted
    const allBudgets = await db.select()
      .from(budgetsTable)
      .execute();

    expect(allBudgets).toHaveLength(1);
    expect(allBudgets[0].id).toEqual(budget2[0].id);
    expect(parseFloat(allBudgets[0].monthly_limit)).toEqual(750.00);
  });

  it('should handle zero id', async () => {
    // Try to delete with id 0
    const result = await deleteBudget(0);

    // Should return false since no budget has id 0
    expect(result.success).toBe(false);
  });

  it('should handle negative id', async () => {
    // Try to delete with negative id
    const result = await deleteBudget(-1);

    // Should return false since no budget has negative id
    expect(result.success).toBe(false);
  });
});
