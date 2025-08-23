import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput, type UpdateBudgetInput } from '../schema';
import { createBudget, getBudgets, updateBudget } from '../handlers/budget';
import { eq } from 'drizzle-orm';

describe('budget handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestCategory = async () => {
    const result = await db
      .insert(categoriesTable)
      .values({ name: 'Test Category' })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a budget with correct numeric conversion', async () => {
    const category = await createTestCategory();
    const input: CreateBudgetInput = {
      category_id: category.id,
      amount: 150.75,
    };
    const budget = await createBudget(input);

    expect(budget.id).toBeDefined();
    expect(budget.category_id).toBe(category.id);
    expect(budget.amount).toBe(150.75);
    expect(typeof budget.amount).toBe('number');

    // Verify stored value in DB is numeric string
    const rows = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget.id))
      .execute();
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].amount)).toBe(150.75);
  });

  it('should retrieve all budgets with proper conversion', async () => {
    const category = await createTestCategory();
    await createBudget({ category_id: category.id, amount: 99.99 });

    const budgets = await getBudgets();
    expect(budgets.length).toBeGreaterThan(0);
    const b = budgets[0];
    expect(typeof b.amount).toBe('number');
    expect(b.amount).toBe(99.99);
  });

  it('should update a budget and convert numeric fields', async () => {
    const category = await createTestCategory();
    const created = await createBudget({ category_id: category.id, amount: 10.0 });

    const updateInput: UpdateBudgetInput = {
      id: created.id,
      amount: 55.55,
    };
    const updated = await updateBudget(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.amount).toBe(55.55);
    expect(typeof updated.amount).toBe('number');

    // Verify DB value
    const rows = await db
      .select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, created.id))
      .execute();
    expect(parseFloat(rows[0].amount)).toBe(55.55);
  });
});
