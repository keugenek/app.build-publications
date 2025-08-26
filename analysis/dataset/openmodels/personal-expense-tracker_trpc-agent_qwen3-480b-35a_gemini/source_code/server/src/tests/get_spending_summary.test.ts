import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, budgetsTable } from '../db/schema';
import { getSpendingSummary } from '../handlers/get_spending_summary';

describe('getSpendingSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no transactions exist', async () => {
    const result = await getSpendingSummary();
    
    expect(result.byCategory).toEqual([]);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it('should calculate summary correctly with transactions', async () => {
    // Insert test transactions
    await db.insert(transactionsTable).values([
      {
        amount: '1000.00',
        date: '2023-01-15',
        description: 'Salary',
        type: 'income',
        category: 'Salary'
      },
      {
        amount: '200.00',
        date: '2023-01-16',
        description: 'Groceries',
        type: 'expense',
        category: 'Food'
      },
      {
        amount: '50.00',
        date: '2023-01-17',
        description: 'Bus fare',
        type: 'expense',
        category: 'Transport'
      },
      {
        amount: '150.00',
        date: '2023-01-18',
        description: 'Electricity bill',
        type: 'expense',
        category: 'Utilities'
      }
    ]).execute();

    const result = await getSpendingSummary();

    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpenses).toBe(400);
    expect(result.netAmount).toBe(600);

    expect(result.byCategory).toHaveLength(3);
    
    const foodCategory = result.byCategory.find(c => c.category === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory!.amount).toBe(200);
    
    const transportCategory = result.byCategory.find(c => c.category === 'Transport');
    expect(transportCategory).toBeDefined();
    expect(transportCategory!.amount).toBe(50);
    
    const utilitiesCategory = result.byCategory.find(c => c.category === 'Utilities');
    expect(utilitiesCategory).toBeDefined();
    expect(utilitiesCategory!.amount).toBe(150);
  });

  it('should filter by month and year correctly', async () => {
    // Insert test transactions for January 2023
    await db.insert(transactionsTable).values([
      {
        amount: '1000.00',
        date: '2023-01-15',
        description: 'Salary',
        type: 'income',
        category: 'Salary'
      },
      {
        amount: '200.00',
        date: '2023-01-16',
        description: 'Groceries',
        type: 'expense',
        category: 'Food'
      }
    ]).execute();

    // Insert test transactions for February 2023
    await db.insert(transactionsTable).values([
      {
        amount: '500.00',
        date: '2023-02-15',
        description: 'Freelance work',
        type: 'income',
        category: 'Salary'
      },
      {
        amount: '100.00',
        date: '2023-02-16',
        description: 'Restaurant',
        type: 'expense',
        category: 'Food'
      }
    ]).execute();

    // Test for January 2023
    const janResult = await getSpendingSummary(1, 2023);
    expect(janResult.totalIncome).toBe(1000);
    expect(janResult.totalExpenses).toBe(200);
    expect(janResult.netAmount).toBe(800);
    
    const janFoodCategory = janResult.byCategory.find(c => c.category === 'Food');
    expect(janFoodCategory).toBeDefined();
    expect(janFoodCategory!.amount).toBe(200);

    // Test for February 2023
    const febResult = await getSpendingSummary(2, 2023);
    expect(febResult.totalIncome).toBe(500);
    expect(febResult.totalExpenses).toBe(100);
    expect(febResult.netAmount).toBe(400);
    
    const febFoodCategory = febResult.byCategory.find(c => c.category === 'Food');
    expect(febFoodCategory).toBeDefined();
    expect(febFoodCategory!.amount).toBe(100);
  });

  it('should include budget information when available', async () => {
    // Insert test transactions
    await db.insert(transactionsTable).values([
      {
        amount: '300.00',
        date: '2023-01-15',
        description: 'Groceries',
        type: 'expense',
        category: 'Food'
      }
    ]).execute();

    // Insert test budget
    await db.insert(budgetsTable).values({
      category: 'Food',
      amount: '400.00',
      month: 1,
      year: 2023
    }).execute();

    const result = await getSpendingSummary(1, 2023);

    expect(result.byCategory).toHaveLength(1);
    const foodCategory = result.byCategory[0];
    expect(foodCategory.category).toBe('Food');
    expect(foodCategory.amount).toBe(300);
    expect(foodCategory.budget).toBe(400);
    expect(foodCategory.remaining).toBe(100);
  });

  it('should handle case when expenses exceed budget', async () => {
    // Insert test transactions
    await db.insert(transactionsTable).values([
      {
        amount: '200.00',
        date: '2023-01-15',
        description: 'Electricity',
        type: 'expense',
        category: 'Utilities'
      }
    ]).execute();

    // Insert test budget
    await db.insert(budgetsTable).values({
      category: 'Utilities',
      amount: '150.00',
      month: 1,
      year: 2023
    }).execute();

    const result = await getSpendingSummary(1, 2023);

    expect(result.byCategory).toHaveLength(1);
    const utilitiesCategory = result.byCategory[0];
    expect(utilitiesCategory.category).toBe('Utilities');
    expect(utilitiesCategory.amount).toBe(200);
    expect(utilitiesCategory.budget).toBe(150);
    expect(utilitiesCategory.remaining).toBe(-50);
  });
});
