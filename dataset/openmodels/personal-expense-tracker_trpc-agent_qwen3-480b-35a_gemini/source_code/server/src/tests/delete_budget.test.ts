import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { deleteBudget } from '../handlers/delete_budget';
import { eq } from 'drizzle-orm';

describe('deleteBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a budget by id', async () => {
    // First create a budget directly in the database
    const createdBudgetResult = await db.insert(budgetsTable)
      .values({
        category: 'Food',
        amount: '500.00',
        month: 1,
        year: 2024
      })
      .returning()
      .execute();
    
    const createdBudget = createdBudgetResult[0];
    
    // Verify the budget was created
    expect(createdBudget.id).toBeDefined();
    expect(createdBudget.category).toEqual('Food');

    // Delete the budget
    const result = await deleteBudget(createdBudget.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the budget no longer exists in the database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, createdBudget.id))
      .execute();

    expect(budgets).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent budget', async () => {
    // Try to delete a budget that doesn't exist
    const result = await deleteBudget(99999);
    
    // Should return false since no rows were deleted
    expect(result).toBe(false);
  });
});
