import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { deleteBudget } from '../handlers/delete_budget';
import { eq } from 'drizzle-orm';

describe('deleteBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing budget', async () => {
    // Create a category first (required for budget)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create a budget
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: category.id,
        amount: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budget = budgetResult[0];

    // Delete the budget
    const result = await deleteBudget(budget.id);

    expect(result.success).toBe(true);

    // Verify budget was deleted from database
    const budgetsInDb = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget.id))
      .execute();

    expect(budgetsInDb).toHaveLength(0);
  });

  it('should throw error when budget does not exist', async () => {
    const nonExistentId = 99999;

    await expect(deleteBudget(nonExistentId))
      .rejects.toThrow(/Budget with id 99999 not found/i);
  });

  it('should not affect other budgets when deleting one', async () => {
    // Create a category first (required for budgets)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create multiple budgets
    const budget1Result = await db.insert(budgetsTable)
      .values({
        category_id: category.id,
        amount: '500.00',
        month: 3,
        year: 2024
      })
      .returning()
      .execute();

    const budget2Result = await db.insert(budgetsTable)
      .values({
        category_id: category.id,
        amount: '750.00',
        month: 4,
        year: 2024
      })
      .returning()
      .execute();

    const budget1 = budget1Result[0];
    const budget2 = budget2Result[0];

    // Delete first budget
    const result = await deleteBudget(budget1.id);

    expect(result.success).toBe(true);

    // Verify first budget was deleted
    const deletedBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget1.id))
      .execute();

    expect(deletedBudgets).toHaveLength(0);

    // Verify second budget still exists
    const remainingBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget2.id))
      .execute();

    expect(remainingBudgets).toHaveLength(1);
    expect(remainingBudgets[0].id).toBe(budget2.id);
    expect(parseFloat(remainingBudgets[0].amount)).toBe(750.00);
  });

  it('should handle deletion of budget with numeric amount correctly', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Groceries',
        color: '#00FF00'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create budget with specific numeric amount
    const budgetResult = await db.insert(budgetsTable)
      .values({
        category_id: category.id,
        amount: '1250.50', // Specific decimal amount
        month: 12,
        year: 2023
      })
      .returning()
      .execute();

    const budget = budgetResult[0];

    // Verify budget was created with correct amount
    expect(parseFloat(budget.amount)).toBe(1250.50);

    // Delete the budget
    const result = await deleteBudget(budget.id);

    expect(result.success).toBe(true);

    // Verify budget no longer exists
    const budgetsInDb = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget.id))
      .execute();

    expect(budgetsInDb).toHaveLength(0);
  });
});
