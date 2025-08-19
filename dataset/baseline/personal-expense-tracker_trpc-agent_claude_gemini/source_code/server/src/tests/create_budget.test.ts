import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { createBudget } from '../handlers/create_budget';
import { eq, and } from 'drizzle-orm';

describe('createBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;

  // Create a test category before each test
  beforeEach(async () => {
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;
  });

  const testInput: CreateBudgetInput = {
    category_id: 1, // Will be overridden in tests
    amount: 500.75,
    month: 3,
    year: 2024
  };

  it('should create a new budget', async () => {
    const input = { ...testInput, category_id: categoryId };
    const result = await createBudget(input);

    expect(result.category_id).toEqual(categoryId);
    expect(result.amount).toEqual(500.75);
    expect(typeof result.amount).toEqual('number');
    expect(result.month).toEqual(3);
    expect(result.year).toEqual(2024);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save budget to database', async () => {
    const input = { ...testInput, category_id: categoryId };
    const result = await createBudget(input);

    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(budgets[0].category_id).toEqual(categoryId);
    expect(parseFloat(budgets[0].amount)).toEqual(500.75);
    expect(budgets[0].month).toEqual(3);
    expect(budgets[0].year).toEqual(2024);
    expect(budgets[0].created_at).toBeInstanceOf(Date);
    expect(budgets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing budget for same category/month/year', async () => {
    const input = { ...testInput, category_id: categoryId };
    
    // Create first budget
    const firstBudget = await createBudget(input);
    
    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Create second budget with same category/month/year but different amount
    const updatedInput = { ...input, amount: 750.25 };
    const secondBudget = await createBudget(updatedInput);

    // Should have same ID (updated, not created new)
    expect(secondBudget.id).toEqual(firstBudget.id);
    expect(secondBudget.amount).toEqual(750.25);
    expect(secondBudget.category_id).toEqual(categoryId);
    expect(secondBudget.month).toEqual(3);
    expect(secondBudget.year).toEqual(2024);
    
    // Updated timestamp should be newer
    expect(secondBudget.updated_at.getTime()).toBeGreaterThan(firstBudget.updated_at.getTime());

    // Verify only one budget exists in database
    const allBudgets = await db.select()
      .from(budgetsTable)
      .where(and(
        eq(budgetsTable.category_id, categoryId),
        eq(budgetsTable.month, 3),
        eq(budgetsTable.year, 2024)
      ))
      .execute();

    expect(allBudgets).toHaveLength(1);
    expect(parseFloat(allBudgets[0].amount)).toEqual(750.25);
  });

  it('should allow different budgets for different months', async () => {
    const input1 = { ...testInput, category_id: categoryId, month: 3 };
    const input2 = { ...testInput, category_id: categoryId, month: 4 };

    const budget1 = await createBudget(input1);
    const budget2 = await createBudget(input2);

    expect(budget1.id).not.toEqual(budget2.id);
    expect(budget1.month).toEqual(3);
    expect(budget2.month).toEqual(4);

    // Verify both exist in database
    const allBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(allBudgets).toHaveLength(2);
  });

  it('should allow different budgets for different years', async () => {
    const input1 = { ...testInput, category_id: categoryId, year: 2024 };
    const input2 = { ...testInput, category_id: categoryId, year: 2025 };

    const budget1 = await createBudget(input1);
    const budget2 = await createBudget(input2);

    expect(budget1.id).not.toEqual(budget2.id);
    expect(budget1.year).toEqual(2024);
    expect(budget2.year).toEqual(2025);

    // Verify both exist in database
    const allBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, categoryId))
      .execute();

    expect(allBudgets).toHaveLength(2);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = { 
      ...testInput, 
      category_id: categoryId,
      amount: 123.45 // 2 decimal places (matches numeric precision)
    };
    
    const result = await createBudget(input);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toEqual('number');

    // Check database storage
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(parseFloat(budgets[0].amount)).toEqual(123.45);
  });

  it('should throw error for non-existent category', async () => {
    const input = { ...testInput, category_id: 99999 }; // Non-existent category

    await expect(createBudget(input)).rejects.toThrow(/category.*does not exist/i);
  });

  it('should handle multiple categories with same month/year', async () => {
    // Create second category
    const secondCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        description: 'Another category for testing'
      })
      .returning()
      .execute();
    const secondCategoryId = secondCategoryResult[0].id;

    const input1 = { ...testInput, category_id: categoryId };
    const input2 = { ...testInput, category_id: secondCategoryId };

    const budget1 = await createBudget(input1);
    const budget2 = await createBudget(input2);

    expect(budget1.id).not.toEqual(budget2.id);
    expect(budget1.category_id).toEqual(categoryId);
    expect(budget2.category_id).toEqual(secondCategoryId);

    // Both should have same month/year but different categories
    expect(budget1.month).toEqual(budget2.month);
    expect(budget1.year).toEqual(budget2.year);
  });
});
