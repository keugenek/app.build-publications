import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, budgetsTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';
import { createBudget, getBudgets } from '../handlers/create_budget';
import { eq } from 'drizzle-orm';

// Helper to create a category
const createCategory = async (name: string) => {
  const result = await db
    .insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

const testInput: CreateBudgetInput = {
  category_id: 0, // will be overwritten after creating category
  amount: 250.5,
  month: 5,
  year: 2024,
};

describe('budget handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget with numeric conversion', async () => {
    const category = await createCategory('Utilities');
    const input = { ...testInput, category_id: category.id };
    const result = await createBudget(input);

    // Verify returned fields
    expect(result.id).toBeDefined();
    expect(result.category_id).toEqual(category.id);
    expect(result.amount).toBeCloseTo(250.5);
    expect(result.month).toEqual(5);
    expect(result.year).toEqual(2024);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify stored values in DB
    const rows = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(parseFloat(row.amount)).toBeCloseTo(250.5);
    expect(row.month).toEqual(5);
    expect(row.year).toEqual(2024);
  });

  it('should retrieve budgets with numeric conversion', async () => {
    const category = await createCategory('Food');
    const input = { ...testInput, category_id: category.id, amount: 123.45 };
    const created = await createBudget(input);

    const budgets = await getBudgets();
    // Find the created budget
    const fetched = budgets.find(b => b.id === created.id);
    expect(fetched).toBeDefined();
    if (fetched) {
      expect(fetched.amount).toBeCloseTo(123.45);
      expect(typeof fetched.amount).toBe('number');
    }
  });
});
