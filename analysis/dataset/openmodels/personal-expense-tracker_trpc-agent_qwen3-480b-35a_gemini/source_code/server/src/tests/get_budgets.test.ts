import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { getBudgets } from '../handlers/get_budgets';

describe('getBudgets', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(budgetsTable).values([
      {
        category: 'Food',
        amount: '500.00',
        month: 1,
        year: 2023,
      },
      {
        category: 'Transport',
        amount: '200.00',
        month: 1,
        year: 2023,
      },
      {
        category: 'Utilities',
        amount: '300.00',
        month: 1,
        year: 2023,
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all budgets from the database', async () => {
    const budgets = await getBudgets();

    expect(budgets).toHaveLength(3);
    
    // Check that all required fields are present and have correct types
    budgets.forEach(budget => {
      expect(budget.id).toBeDefined();
      expect(typeof budget.id).toBe('number');
      expect(typeof budget.amount).toBe('number');
      expect(budget.category).toBeDefined();
      expect(budget.month).toBeDefined();
      expect(budget.year).toBeDefined();
      expect(budget.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return budgets with correct data', async () => {
    const budgets = await getBudgets();
    
    const foodBudget = budgets.find(b => b.category === 'Food');
    const transportBudget = budgets.find(b => b.category === 'Transport');
    const utilitiesBudget = budgets.find(b => b.category === 'Utilities');
    
    expect(foodBudget).toBeDefined();
    expect(foodBudget?.amount).toBe(500);
    expect(transportBudget?.amount).toBe(200);
    expect(utilitiesBudget?.amount).toBe(300);
  });

  it('should return empty array when no budgets exist', async () => {
    // Clear the database
    await db.delete(budgetsTable).execute();
    
    const budgets = await getBudgets();
    
    expect(budgets).toHaveLength(0);
  });
});
