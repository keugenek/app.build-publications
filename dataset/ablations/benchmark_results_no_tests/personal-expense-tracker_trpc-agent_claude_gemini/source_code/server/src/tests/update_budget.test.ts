import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type UpdateBudgetInput, type CreateCategoryInput } from '../schema';
import { updateBudget } from '../handlers/update_budget';
import { eq } from 'drizzle-orm';

// Helper to create test category
const createTestCategory = async (name: string = 'Test Category'): Promise<number> => {
  const result = await db.insert(categoriesTable)
    .values({
      name,
      color: '#FF0000'
    })
    .returning()
    .execute();
  return result[0].id;
};

// Helper to create test budget
const createTestBudget = async (categoryId: number, amount: number = 500.00, month: number = 6, year: number = 2024): Promise<number> => {
  const result = await db.insert(budgetsTable)
    .values({
      category_id: categoryId,
      amount: amount.toString(),
      month,
      year
    })
    .returning()
    .execute();
  return result[0].id;
};

describe('updateBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update budget amount', async () => {
    const categoryId = await createTestCategory('Food');
    const budgetId = await createTestBudget(categoryId, 500.00, 6, 2024);

    const input: UpdateBudgetInput = {
      id: budgetId,
      amount: 750.50
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(budgetId);
    expect(result.amount).toEqual(750.50);
    expect(typeof result.amount).toBe('number');
    expect(result.category_id).toEqual(categoryId);
    expect(result.month).toEqual(6);
    expect(result.year).toEqual(2024);
  });

  it('should update budget category', async () => {
    const categoryId1 = await createTestCategory('Food');
    const categoryId2 = await createTestCategory('Transportation');
    const budgetId = await createTestBudget(categoryId1);

    const input: UpdateBudgetInput = {
      id: budgetId,
      category_id: categoryId2
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(budgetId);
    expect(result.category_id).toEqual(categoryId2);
    expect(result.amount).toEqual(500.00);
  });

  it('should update budget month and year', async () => {
    const categoryId = await createTestCategory('Entertainment');
    const budgetId = await createTestBudget(categoryId, 300.00, 6, 2024);

    const input: UpdateBudgetInput = {
      id: budgetId,
      month: 12,
      year: 2025
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(budgetId);
    expect(result.month).toEqual(12);
    expect(result.year).toEqual(2025);
    expect(result.category_id).toEqual(categoryId);
    expect(result.amount).toEqual(300.00);
  });

  it('should update multiple fields at once', async () => {
    const categoryId1 = await createTestCategory('Groceries');
    const categoryId2 = await createTestCategory('Dining');
    const budgetId = await createTestBudget(categoryId1, 400.00, 3, 2024);

    const input: UpdateBudgetInput = {
      id: budgetId,
      category_id: categoryId2,
      amount: 650.75,
      month: 8,
      year: 2025
    };

    const result = await updateBudget(input);

    expect(result.id).toEqual(budgetId);
    expect(result.category_id).toEqual(categoryId2);
    expect(result.amount).toEqual(650.75);
    expect(result.month).toEqual(8);
    expect(result.year).toEqual(2025);
  });

  it('should save updated budget to database', async () => {
    const categoryId = await createTestCategory('Health');
    const budgetId = await createTestBudget(categoryId, 200.00, 9, 2024);

    const input: UpdateBudgetInput = {
      id: budgetId,
      amount: 350.25,
      month: 10
    };

    await updateBudget(input);

    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budgetId))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(parseFloat(budgets[0].amount)).toEqual(350.25);
    expect(budgets[0].month).toEqual(10);
    expect(budgets[0].year).toEqual(2024); // Should remain unchanged
    expect(budgets[0].category_id).toEqual(categoryId); // Should remain unchanged
  });

  it('should throw error when budget does not exist', async () => {
    const input: UpdateBudgetInput = {
      id: 99999,
      amount: 100.00
    };

    expect(updateBudget(input)).rejects.toThrow(/budget with id 99999 not found/i);
  });

  it('should throw error when category does not exist', async () => {
    const categoryId = await createTestCategory('Valid Category');
    const budgetId = await createTestBudget(categoryId);

    const input: UpdateBudgetInput = {
      id: budgetId,
      category_id: 99999
    };

    expect(updateBudget(input)).rejects.toThrow(/category with id 99999 not found/i);
  });

  it('should throw error when duplicate budget would be created', async () => {
    const categoryId = await createTestCategory('Utilities');
    
    // Create two budgets for the same category
    const budgetId1 = await createTestBudget(categoryId, 300.00, 5, 2024);
    const budgetId2 = await createTestBudget(categoryId, 400.00, 6, 2024);

    // Try to update budget2 to have same category/month/year as budget1
    const input: UpdateBudgetInput = {
      id: budgetId2,
      month: 5 // This would create duplicate with budget1
    };

    expect(updateBudget(input)).rejects.toThrow(/budget for category .* already exists/i);
  });

  it('should allow updating to same values without duplicate error', async () => {
    const categoryId = await createTestCategory('Books');
    const budgetId = await createTestBudget(categoryId, 150.00, 4, 2024);

    // Update with same category/month/year but different amount
    const input: UpdateBudgetInput = {
      id: budgetId,
      category_id: categoryId,
      month: 4,
      year: 2024,
      amount: 200.00
    };

    const result = await updateBudget(input);

    expect(result.amount).toEqual(200.00);
    expect(result.category_id).toEqual(categoryId);
    expect(result.month).toEqual(4);
    expect(result.year).toEqual(2024);
  });

  it('should handle partial updates without affecting other fields', async () => {
    const categoryId = await createTestCategory('Travel');
    const budgetId = await createTestBudget(categoryId, 1000.00, 7, 2024);

    // Only update amount
    const input: UpdateBudgetInput = {
      id: budgetId,
      amount: 1250.50
    };

    const result = await updateBudget(input);

    // Verify only amount changed
    expect(result.amount).toEqual(1250.50);
    expect(result.category_id).toEqual(categoryId); // Unchanged
    expect(result.month).toEqual(7); // Unchanged
    expect(result.year).toEqual(2024); // Unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
