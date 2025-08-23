import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { createBudget } from '../handlers/create_budget';
import { eq } from 'drizzle-orm';

// Test category data
const testCategory = {
  name: 'Test Category'
};

// Test budget input
const testInput: CreateBudgetInput = {
  category_id: 1,
  amount: 500.00,
  month: 1,
  year: 2024
};

describe('createBudget', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test category first since budget requires a valid category_id
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    // Update the test input with the actual category ID
    testInput.category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a budget', async () => {
    const result = await createBudget(testInput);

    // Basic field validation
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.amount).toEqual(500.00);
    expect(result.month).toEqual(1);
    expect(result.year).toEqual(2024);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save budget to database', async () => {
    const result = await createBudget(testInput);

    // Query using proper drizzle syntax
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(budgets[0].category_id).toEqual(testInput.category_id);
    expect(parseFloat(budgets[0].amount)).toEqual(500.00);
    expect(budgets[0].month).toEqual(1);
    expect(budgets[0].year).toEqual(2024);
    expect(budgets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CreateBudgetInput = {
      ...testInput,
      amount: 123.45
    };

    const result = await createBudget(decimalInput);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();

    expect(budgets).toHaveLength(1);
    expect(parseFloat(budgets[0].amount)).toEqual(123.45);
  });
});
