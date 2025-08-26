import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput, type CreateCategoryInput } from '../schema';
import { createBudget } from '../handlers/create_budget';
import { eq, and } from 'drizzle-orm';

// Test category for budget creation
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF5733'
};

// Test budget input
const testBudgetInput: CreateBudgetInput = {
  category_id: 1, // Will be updated after creating category
  amount: 500.75,
  month: 3,
  year: 2024
};

describe('createBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;

  beforeEach(async () => {
    // Create a test category before each test
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        color: testCategory.color
      })
      .returning()
      .execute();
    
    categoryId = categoryResult[0].id;
  });

  it('should create a budget successfully', async () => {
    const input = {
      ...testBudgetInput,
      category_id: categoryId
    };

    const result = await createBudget(input);

    // Basic field validation
    expect(result.category_id).toEqual(categoryId);
    expect(result.amount).toEqual(500.75);
    expect(typeof result.amount).toBe('number'); // Verify numeric conversion
    expect(result.month).toEqual(3);
    expect(result.year).toEqual(2024);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save budget to database', async () => {
    const input = {
      ...testBudgetInput,
      category_id: categoryId
    };

    const result = await createBudget(input);

    // Query using proper drizzle syntax
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(budgets[0].category_id).toEqual(categoryId);
    expect(parseFloat(budgets[0].amount)).toEqual(500.75); // Stored as string, convert back
    expect(budgets[0].month).toEqual(3);
    expect(budgets[0].year).toEqual(2024);
    expect(budgets[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent category', async () => {
    const input = {
      ...testBudgetInput,
      category_id: 999 // Non-existent category ID
    };

    await expect(createBudget(input)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should throw error for duplicate budget', async () => {
    const input = {
      ...testBudgetInput,
      category_id: categoryId
    };

    // Create first budget
    await createBudget(input);

    // Try to create duplicate budget for same category/month/year
    await expect(createBudget(input)).rejects.toThrow(/Budget for category .* already exists/i);
  });

  it('should allow different months for same category and year', async () => {
    const input1 = {
      ...testBudgetInput,
      category_id: categoryId,
      month: 3
    };

    const input2 = {
      ...testBudgetInput,
      category_id: categoryId,
      month: 4 // Different month
    };

    const result1 = await createBudget(input1);
    const result2 = await createBudget(input2);

    expect(result1.month).toEqual(3);
    expect(result2.month).toEqual(4);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should allow different years for same category and month', async () => {
    const input1 = {
      ...testBudgetInput,
      category_id: categoryId,
      year: 2024
    };

    const input2 = {
      ...testBudgetInput,
      category_id: categoryId,
      year: 2025 // Different year
    };

    const result1 = await createBudget(input1);
    const result2 = await createBudget(input2);

    expect(result1.year).toEqual(2024);
    expect(result2.year).toEqual(2025);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle different categories for same month and year', async () => {
    // Create second category
    const secondCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        color: '#33FF57'
      })
      .returning()
      .execute();
    
    const secondCategoryId = secondCategoryResult[0].id;

    const input1 = {
      ...testBudgetInput,
      category_id: categoryId
    };

    const input2 = {
      ...testBudgetInput,
      category_id: secondCategoryId // Different category
    };

    const result1 = await createBudget(input1);
    const result2 = await createBudget(input2);

    expect(result1.category_id).toEqual(categoryId);
    expect(result2.category_id).toEqual(secondCategoryId);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = {
      ...testBudgetInput,
      category_id: categoryId,
      amount: 1234.56 // Test decimal precision
    };

    const result = await createBudget(input);

    expect(result.amount).toEqual(1234.56);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(parseFloat(budgets[0].amount)).toEqual(1234.56);
  });

  it('should verify database constraints work correctly', async () => {
    const input = {
      ...testBudgetInput,
      category_id: categoryId
    };

    const result = await createBudget(input);

    // Query with complex conditions to verify data integrity
    const budgets = await db.select()
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.category_id, categoryId),
          eq(budgetsTable.month, 3),
          eq(budgetsTable.year, 2024)
        )
      )
      .execute();

    expect(budgets).toHaveLength(1);
    expect(budgets[0].id).toEqual(result.id);
    expect(budgets[0].category_id).toEqual(categoryId);
    expect(budgets[0].month).toEqual(3);
    expect(budgets[0].year).toEqual(2024);
  });
});
