import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { deleteBudget } from '../handlers/delete_budget';
import { eq } from 'drizzle-orm';

describe('deleteBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing budget and return true', async () => {
    // Create a category first (required for budget)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budgetId = budgetResult[0].id;

    // Delete the budget
    const result = await deleteBudget(budgetId);

    // Should return true
    expect(result).toBe(true);

    // Verify budget was deleted from database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(budgets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent budget', async () => {
    const nonExistentId = 99999;

    const result = await deleteBudget(nonExistentId);

    // Should return false when budget doesn't exist
    expect(result).toBe(false);
  });

  it('should not affect other budgets when deleting specific budget', async () => {
    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create two budgets
    const budget1Result = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budget2Result = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '600.00',
        month: 4,
        year: 2024
      })
      .returning()
      .execute();

    const budget1Id = budget1Result[0].id;
    const budget2Id = budget2Result[0].id;

    // Delete only the first budget
    const result = await deleteBudget(budget1Id);

    expect(result).toBe(true);

    // Verify first budget was deleted
    const deletedBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget1Id))
      .execute();

    expect(deletedBudget).toHaveLength(0);

    // Verify second budget still exists
    const remainingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget2Id))
      .execute();

    expect(remainingBudget).toHaveLength(1);
    expect(parseFloat(remainingBudget[0].monthly_limit)).toEqual(600.00);
    expect(remainingBudget[0].month).toEqual(4);
  });

  it('should handle multiple deletion attempts gracefully', async () => {
    // Create a category and budget
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budgetId = budgetResult[0].id;

    // First deletion should succeed
    const firstResult = await deleteBudget(budgetId);
    expect(firstResult).toBe(true);

    // Second deletion of same budget should return false
    const secondResult = await deleteBudget(budgetId);
    expect(secondResult).toBe(false);
  });
});
