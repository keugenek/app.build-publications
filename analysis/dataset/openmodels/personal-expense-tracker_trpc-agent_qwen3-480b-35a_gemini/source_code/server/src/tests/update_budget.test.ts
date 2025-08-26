import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type UpdateBudgetInput, type CreateBudgetInput } from '../schema';
import { updateBudget } from '../handlers/update_budget';
import { eq } from 'drizzle-orm';

// Test data for creating a budget
const createBudgetInput: CreateBudgetInput = {
  category: 'Food',
  amount: 500.00,
  month: 1,
  year: 2023
};

// Helper function to create a test budget
const createTestBudget = async () => {
  const result = await db.insert(budgetsTable)
    .values({
      category: createBudgetInput.category,
      amount: createBudgetInput.amount.toString(),
      month: createBudgetInput.month,
      year: createBudgetInput.year
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    amount: parseFloat(result[0].amount)
  };
};

describe('updateBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a budget category', async () => {
    // Create a test budget first
    const budget = await createTestBudget();
    
    // Update the budget category
    const updateInput: UpdateBudgetInput = {
      id: budget.id,
      category: 'Transport'
    };
    
    const result = await updateBudget(updateInput);
    
    // Validate the updated fields
    expect(result.id).toEqual(budget.id);
    expect(result.category).toEqual('Transport');
    expect(result.amount).toEqual(500.00); // Should remain unchanged
    expect(result.month).toEqual(1); // Should remain unchanged
    expect(result.year).toEqual(2023); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a budget amount', async () => {
    // Create a test budget first
    const budget = await createTestBudget();
    
    // Update the budget amount
    const updateInput: UpdateBudgetInput = {
      id: budget.id,
      amount: 750.50
    };
    
    const result = await updateBudget(updateInput);
    
    // Validate the updated fields
    expect(result.id).toEqual(budget.id);
    expect(result.category).toEqual('Food'); // Should remain unchanged
    expect(result.amount).toEqual(750.50);
    expect(result.month).toEqual(1); // Should remain unchanged
    expect(result.year).toEqual(2023); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple budget fields', async () => {
    // Create a test budget first
    const budget = await createTestBudget();
    
    // Update multiple fields
    const updateInput: UpdateBudgetInput = {
      id: budget.id,
      category: 'Utilities',
      amount: 300.75,
      month: 2,
      year: 2024
    };
    
    const result = await updateBudget(updateInput);
    
    // Validate all updated fields
    expect(result.id).toEqual(budget.id);
    expect(result.category).toEqual('Utilities');
    expect(result.amount).toEqual(300.75);
    expect(result.month).toEqual(2);
    expect(result.year).toEqual(2024);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated budget to database', async () => {
    // Create a test budget first
    const budget = await createTestBudget();
    
    // Update the budget
    const updateInput: UpdateBudgetInput = {
      id: budget.id,
      category: 'Entertainment',
      amount: 200.00
    };
    
    await updateBudget(updateInput);
    
    // Query the database to verify the update was saved
    const budgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, budget.id))
      .execute();
    
    expect(budgets).toHaveLength(1);
    expect(budgets[0].id).toEqual(budget.id);
    expect(budgets[0].category).toEqual('Entertainment');
    expect(parseFloat(budgets[0].amount)).toEqual(200.00);
    expect(budgets[0].month).toEqual(1); // Should remain unchanged
    expect(budgets[0].year).toEqual(2023); // Should remain unchanged
    expect(budgets[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent budget', async () => {
    // Try to update a budget that doesn't exist
    const updateInput: UpdateBudgetInput = {
      id: 99999, // Non-existent ID
      category: 'Healthcare'
    };
    
    await expect(updateBudget(updateInput))
      .rejects
      .toThrow(/Budget with id 99999 not found/);
  });
});
