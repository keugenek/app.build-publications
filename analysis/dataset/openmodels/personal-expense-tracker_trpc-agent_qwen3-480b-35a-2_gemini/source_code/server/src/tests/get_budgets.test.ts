import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type CreateBudgetInput } from '../schema';
import { getBudgets } from '../handlers/get_budgets';
import { eq } from 'drizzle-orm';

// Test data
const testCategoryInput: CreateCategoryInput = {
  name: 'Food',
};

const testBudgetInputs: CreateBudgetInput[] = [
  {
    category_id: 1, // Will be updated after category creation
    amount: 500.00,
    month: 1,
    year: 2024,
  },
  {
    category_id: 1, // Will be updated after category creation
    amount: 600.00,
    month: 2,
    year: 2024,
  },
];

describe('getBudgets', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first since budgets need a category_id
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategoryInput)
      .returning()
      .execute();
    
    const categoryId = categoryResult[0].id;
    
    // Update test budget inputs with the real category ID
    const budgetsToInsert = testBudgetInputs.map(budget => ({
      ...budget,
      category_id: categoryId,
    }));
    
    // Insert test budgets
    await db.insert(budgetsTable)
      .values(budgetsToInsert.map(budget => ({
        ...budget,
        amount: budget.amount.toString(), // Convert number to string for numeric column
      })))
      .execute();
  });
  
  afterEach(resetDB);

  it('should fetch all budgets from the database', async () => {
    const budgets = await getBudgets();
    
    expect(budgets).toHaveLength(2);
    
    // Check that all budgets have the expected structure
    budgets.forEach(budget => {
      expect(budget).toHaveProperty('id');
      expect(budget).toHaveProperty('category_id');
      expect(budget).toHaveProperty('amount');
      expect(budget).toHaveProperty('month');
      expect(budget).toHaveProperty('year');
      expect(budget).toHaveProperty('created_at');
      
      // Verify types
      expect(typeof budget.id).toBe('number');
      expect(typeof budget.category_id).toBe('number');
      expect(typeof budget.amount).toBe('number');
      expect(typeof budget.month).toBe('number');
      expect(typeof budget.year).toBe('number');
      expect(budget.created_at).toBeInstanceOf(Date);
    });
    
    // Check specific values
    const firstBudget = budgets.find(b => b.month === 1);
    const secondBudget = budgets.find(b => b.month === 2);
    
    expect(firstBudget).toBeDefined();
    expect(firstBudget!.amount).toBe(500.00);
    
    expect(secondBudget).toBeDefined();
    expect(secondBudget!.amount).toBe(600.00);
  });

  it('should return an empty array when no budgets exist', async () => {
    // Clear all budgets
    await db.delete(budgetsTable).execute();
    
    const budgets = await getBudgets();
    
    expect(budgets).toHaveLength(0);
    expect(budgets).toEqual([]);
  });

  it('should handle budgets with decimal amounts correctly', async () => {
    // Create a budget with a decimal amount
    const categoryResult = await db.select().from(categoriesTable).limit(1).execute();
    const categoryId = categoryResult[0].id;
    
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        amount: '123.45',
        month: 3,
        year: 2024,
      })
      .execute();
    
    const budgets = await getBudgets();
    
    // Find the budget with month 3
    const budgetWithDecimal = budgets.find(b => b.month === 3);
    
    expect(budgetWithDecimal).toBeDefined();
    expect(budgetWithDecimal!.amount).toBe(123.45);
    expect(typeof budgetWithDecimal!.amount).toBe('number');
  });
});
