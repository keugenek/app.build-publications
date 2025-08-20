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

  let testCategoryId: number;

  beforeEach(async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();

    testCategoryId = categoryResult[0].id;
  });

  // Simple test input
  const createTestInput = (): CreateBudgetInput => ({
    category_id: testCategoryId,
    monthly_limit: 500.75,
    month: 3,
    year: 2024
  });

  it('should create a budget successfully', async () => {
    const testInput = createTestInput();
    const result = await createBudget(testInput);

    // Basic field validation
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.monthly_limit).toEqual(500.75);
    expect(typeof result.monthly_limit).toEqual('number');
    expect(result.month).toEqual(3);
    expect(result.year).toEqual(2024);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save budget to database with correct numeric conversion', async () => {
    const testInput = createTestInput();
    const result = await createBudget(testInput);

    // Query the database to verify the budget was saved
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(budgets[0].category_id).toEqual(testCategoryId);
    expect(parseFloat(budgets[0].monthly_limit)).toEqual(500.75);
    expect(budgets[0].month).toEqual(3);
    expect(budgets[0].year).toEqual(2024);
    expect(budgets[0].created_at).toBeInstanceOf(Date);
    expect(budgets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent category', async () => {
    const testInput: CreateBudgetInput = {
      category_id: 99999, // Non-existent category ID
      monthly_limit: 500.00,
      month: 3,
      year: 2024
    };

    await expect(createBudget(testInput)).rejects.toThrow(/category.*does not exist/i);
  });

  it('should throw error for duplicate budget', async () => {
    const testInput = createTestInput();

    // Create the first budget
    await createBudget(testInput);

    // Try to create a duplicate budget with same category, month, year
    await expect(createBudget(testInput)).rejects.toThrow(/budget already exists/i);
  });

  it('should allow budgets for same category in different months', async () => {
    const baseInput = createTestInput();

    // Create budget for March
    const marchBudget = await createBudget(baseInput);

    // Create budget for April (same category, different month)
    const aprilInput = { ...baseInput, month: 4 };
    const aprilBudget = await createBudget(aprilInput);

    expect(marchBudget.id).not.toEqual(aprilBudget.id);
    expect(marchBudget.month).toEqual(3);
    expect(aprilBudget.month).toEqual(4);
    expect(marchBudget.category_id).toEqual(aprilBudget.category_id);
  });

  it('should allow budgets for same category in different years', async () => {
    const baseInput = createTestInput();

    // Create budget for 2024
    const budget2024 = await createBudget(baseInput);

    // Create budget for 2025 (same category and month, different year)
    const input2025 = { ...baseInput, year: 2025 };
    const budget2025 = await createBudget(input2025);

    expect(budget2024.id).not.toEqual(budget2025.id);
    expect(budget2024.year).toEqual(2024);
    expect(budget2025.year).toEqual(2025);
    expect(budget2024.category_id).toEqual(budget2025.category_id);
    expect(budget2024.month).toEqual(budget2025.month);
  });

  it('should handle budget queries with proper date filtering', async () => {
    const testInput = createTestInput();
    await createBudget(testInput);

    // Test querying budgets by month and year
    const budgets = await db.select()
      .from(budgetsTable)
      .where(and(
        eq(budgetsTable.month, 3),
        eq(budgetsTable.year, 2024)
      ))
      .execute();

    expect(budgets.length).toBeGreaterThan(0);
    budgets.forEach(budget => {
      expect(budget.month).toEqual(3);
      expect(budget.year).toEqual(2024);
      expect(typeof parseFloat(budget.monthly_limit)).toEqual('number');
    });
  });
});
