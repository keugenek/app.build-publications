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
    // Create a test category first (required for foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_predefined: false
      })
      .returning()
      .execute();

    testCategoryId = categoryResult[0].id;
  });

  const testInput: CreateBudgetInput = {
    category_id: 0, // Will be set to testCategoryId in tests
    monthly_limit: 500.00,
    month: 3,
    year: 2024
  };

  it('should create a budget successfully', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createBudget(input);

    // Verify returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.monthly_limit).toEqual(500.00);
    expect(typeof result.monthly_limit).toBe('number');
    expect(result.month).toEqual(3);
    expect(result.year).toEqual(2024);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save budget to database correctly', async () => {
    const input = { ...testInput, category_id: testCategoryId };
    const result = await createBudget(input);

    // Query database to verify storage
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    const storedBudget = budgets[0];
    expect(storedBudget.category_id).toEqual(testCategoryId);
    expect(parseFloat(storedBudget.monthly_limit)).toEqual(500.00);
    expect(storedBudget.month).toEqual(3);
    expect(storedBudget.year).toEqual(2024);
    expect(storedBudget.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when category does not exist', async () => {
    const input = { ...testInput, category_id: 99999 }; // Non-existent category

    await expect(createBudget(input)).rejects.toThrow(/Category with id 99999 does not exist/i);
  });

  it('should prevent duplicate budgets for same category/month/year', async () => {
    const input = { ...testInput, category_id: testCategoryId };

    // Create first budget
    await createBudget(input);

    // Attempt to create duplicate budget
    const duplicateInput = { 
      ...input, 
      monthly_limit: 750.00 // Different amount, same category/month/year
    };

    await expect(createBudget(duplicateInput)).rejects.toThrow(
      /Budget already exists for category .* in 3\/2024/i
    );
  });

  it('should allow multiple budgets for same category in different months', async () => {
    const input1 = { ...testInput, category_id: testCategoryId, month: 3 };
    const input2 = { ...testInput, category_id: testCategoryId, month: 4 };

    const result1 = await createBudget(input1);
    const result2 = await createBudget(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.month).toEqual(3);
    expect(result2.month).toEqual(4);

    // Verify both exist in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, testCategoryId))
      .execute();

    expect(budgets).toHaveLength(2);
  });

  it('should allow multiple budgets for same category in different years', async () => {
    const input1 = { ...testInput, category_id: testCategoryId, year: 2024 };
    const input2 = { ...testInput, category_id: testCategoryId, year: 2025 };

    const result1 = await createBudget(input1);
    const result2 = await createBudget(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.year).toEqual(2024);
    expect(result2.year).toEqual(2025);

    // Verify both exist in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, testCategoryId))
      .execute();

    expect(budgets).toHaveLength(2);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = { 
      ...testInput, 
      category_id: testCategoryId,
      monthly_limit: 1234.56 
    };
    
    const result = await createBudget(input);

    expect(result.monthly_limit).toEqual(1234.56);
    expect(typeof result.monthly_limit).toBe('number');

    // Verify precision is maintained in database
    const storedBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(parseFloat(storedBudget[0].monthly_limit)).toEqual(1234.56);
  });

  it('should work with predefined categories', async () => {
    // Create a predefined category
    const predefinedCategory = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        is_predefined: true
      })
      .returning()
      .execute();

    const input = { 
      ...testInput, 
      category_id: predefinedCategory[0].id 
    };
    
    const result = await createBudget(input);

    expect(result.category_id).toEqual(predefinedCategory[0].id);
    expect(result.monthly_limit).toEqual(500.00);
  });
});
