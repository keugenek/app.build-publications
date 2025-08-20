import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type CreateBudgetInput } from '../schema';
import { createBudget } from '../handlers/create_budget';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateBudgetInput = {
  category: 'Food',
  amount: 500.00,
  month: 1,
  year: 2024
};

describe('createBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget', async () => {
    const result = await createBudget(testInput);

    // Basic field validation
    expect(result.category).toEqual('Food');
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
    expect(budgets[0].category).toEqual('Food');
    expect(parseFloat(budgets[0].amount)).toEqual(500.00);
    expect(budgets[0].month).toEqual(1);
    expect(budgets[0].year).toEqual(2024);
    expect(budgets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different categories and amounts', async () => {
    const inputs: CreateBudgetInput[] = [
      {
        category: 'Transport',
        amount: 200.50,
        month: 2,
        year: 2024
      },
      {
        category: 'Utilities',
        amount: 150.75,
        month: 3,
        year: 2024
      }
    ];

    for (const input of inputs) {
      const result = await createBudget(input);
      
      expect(result.category).toEqual(input.category);
      expect(result.amount).toEqual(input.amount);
      expect(result.month).toEqual(input.month);
      expect(result.year).toEqual(input.year);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify in database
      const budgets = await db.select()
        .from(budgetsTable)
        .where(eq(budgetsTable.id, result.id))
        .execute();

      expect(budgets).toHaveLength(1);
      expect(budgets[0].category).toEqual(input.category);
      expect(parseFloat(budgets[0].amount)).toEqual(input.amount);
      expect(budgets[0].month).toEqual(input.month);
      expect(budgets[0].year).toEqual(input.year);
    }
  });
});
