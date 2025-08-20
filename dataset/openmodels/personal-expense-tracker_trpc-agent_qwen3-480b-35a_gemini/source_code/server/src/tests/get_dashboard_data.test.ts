import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, budgetsTable } from '../db/schema';
import { getDashboardData, type SpendingByCategory } from '../handlers/get_dashboard_data';

describe('getDashboardData', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(transactionsTable).values([
      {
        amount: '100.00',
        date: '2023-01-01',
        description: 'Salary',
        type: 'income',
        category: 'Salary'
      },
      {
        amount: '50.00',
        date: '2023-01-02',
        description: 'Groceries',
        type: 'expense',
        category: 'Food'
      },
      {
        amount: '30.00',
        date: '2023-01-03',
        description: 'Gas',
        type: 'expense',
        category: 'Transport'
      },
      {
        amount: '20.00',
        date: '2023-01-04',
        description: 'Electricity',
        type: 'expense',
        category: 'Utilities'
      }
    ]).execute();
    
    // Insert test budgets
    await db.insert(budgetsTable).values([
      {
        category: 'Food',
        amount: '500.00',
        month: 1,
        year: 2023
      },
      {
        category: 'Transport',
        amount: '200.00',
        month: 1,
        year: 2023
      },
      {
        category: 'Utilities',
        amount: '150.00',
        month: 1,
        year: 2023
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should return dashboard data with correct calculations', async () => {
    const result = await getDashboardData();
    
    // Check types
    expect(typeof result.totalIncome).toBe('number');
    expect(typeof result.totalExpenses).toBe('number');
    expect(typeof result.remainingBudget).toBe('number');
    expect(Array.isArray(result.spendingByCategory)).toBe(true);
    expect(Array.isArray(result.spendingTrends)).toBe(true);
    
    // Check values
    expect(result.totalIncome).toBe(100);
    expect(result.totalExpenses).toBe(100);
    expect(result.remainingBudget).toBe(750); // Total budget (850) - total expenses (100)
    
    // Check spending by category
    expect(result.spendingByCategory).toHaveLength(3);
    const foodCategory = result.spendingByCategory.find((c: SpendingByCategory) => c.category === 'Food');
    const transportCategory = result.spendingByCategory.find((c: SpendingByCategory) => c.category === 'Transport');
    const utilitiesCategory = result.spendingByCategory.find((c: SpendingByCategory) => c.category === 'Utilities');
    
    expect(foodCategory).toBeDefined();
    expect(foodCategory?.amount).toBe(50);
    
    expect(transportCategory).toBeDefined();
    expect(transportCategory?.amount).toBe(30);
    
    expect(utilitiesCategory).toBeDefined();
    expect(utilitiesCategory?.amount).toBe(20);
  });

  it('should handle empty database', async () => {
    // Clear all data
    await db.delete(transactionsTable).execute();
    await db.delete(budgetsTable).execute();
    
    const result = await getDashboardData();
    
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.remainingBudget).toBe(0);
    expect(result.spendingByCategory).toHaveLength(0);
    expect(result.spendingTrends).toHaveLength(0);
  });

  it('should calculate remaining budget correctly', async () => {
    // Add more expenses to test budget calculation
    await db.insert(transactionsTable).values({
      amount: '200.00',
      date: '2023-01-05',
      description: 'Additional expense',
      type: 'expense',
      category: 'Other'
    }).execute();
    
    const result = await getDashboardData();
    expect(result.totalExpenses).toBe(300); // 100 + 200
    expect(result.remainingBudget).toBe(550); // 850 - 300
  });
});
