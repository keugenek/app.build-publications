import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { getDashboardData } from '../handlers/get_dashboard_data';
import { eq } from 'drizzle-orm';

describe('getDashboardData', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Food' },
        { name: 'Transport' },
        { name: 'Entertainment' }
      ])
      .returning()
      .execute();
    
    // Create test budgets
    await db.insert(budgetsTable)
      .values([
        { category_id: categories[0].id, amount: '500.00', month: 1, year: 2023 },
        { category_id: categories[1].id, amount: '200.00', month: 1, year: 2023 }
      ])
      .execute();
    
    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        { category_id: categories[0].id, amount: '-150.00', description: 'Groceries', date: new Date('2023-01-15') },
        { category_id: categories[0].id, amount: '-75.50', description: 'Restaurant', date: new Date('2023-01-20') },
        { category_id: categories[1].id, amount: '-50.00', description: 'Bus ticket', date: new Date('2023-01-10') },
        { category_id: categories[2].id, amount: '-100.00', description: 'Movie', date: new Date('2023-01-25') },
        { category_id: categories[0].id, amount: '2000.00', description: 'Salary', date: new Date('2023-01-01') }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should return properly structured dashboard data', async () => {
    const result = await getDashboardData();

    // Check structure
    expect(result).toHaveProperty('categorySpending');
    expect(result).toHaveProperty('monthlySpending');
    expect(Array.isArray(result.categorySpending)).toBe(true);
    expect(Array.isArray(result.monthlySpending)).toBe(true);
  });

  it('should calculate category spending correctly', async () => {
    const result = await getDashboardData();
    const categorySpending = result.categorySpending;

    // Find food category spending
    const foodCategory = categorySpending.find(c => c.category_name === 'Food');
    expect(foodCategory).toBeDefined();
    
    // Food expenses: 150.00 + 75.50 = 225.50 (only negative amounts)
    expect(typeof foodCategory!.total_spent).toBe('number');
    expect(foodCategory!.total_spent).toBeCloseTo(225.50);
    
    // Check budget amount
    expect(typeof foodCategory!.budget_amount).toBe('number');
    expect(foodCategory!.budget_amount).toBeCloseTo(500.00);
    
    // Find transport category spending
    const transportCategory = categorySpending.find(c => c.category_name === 'Transport');
    expect(transportCategory).toBeDefined();
    expect(typeof transportCategory!.total_spent).toBe('number');
    expect(transportCategory!.total_spent).toBeCloseTo(50.00);
    
    // Check budget amount
    expect(typeof transportCategory!.budget_amount).toBe('number');
    expect(transportCategory!.budget_amount).toBeCloseTo(200.00);
    
    // Find entertainment category spending (no budget)
    const entertainmentCategory = categorySpending.find(c => c.category_name === 'Entertainment');
    expect(entertainmentCategory).toBeDefined();
    expect(typeof entertainmentCategory!.total_spent).toBe('number');
    expect(entertainmentCategory!.total_spent).toBeCloseTo(100.00);
    expect(entertainmentCategory!.budget_amount).toBeNull();
  });

  it('should calculate monthly spending correctly', async () => {
    const result = await getDashboardData();
    const monthlySpending = result.monthlySpending;

    // Should have one month (January 2023)
    expect(monthlySpending).toHaveLength(1);
    
    const januaryData = monthlySpending[0];
    expect(januaryData.month).toBe(1);
    expect(januaryData.year).toBe(2023);
    
    // Check income calculation: 2000.00
    expect(typeof januaryData.total_income).toBe('number');
    expect(januaryData.total_income).toBeCloseTo(2000.00);
    
    // Check expenses calculation: 150.00 + 75.50 + 50.00 + 100.00 = 375.50
    expect(typeof januaryData.total_expenses).toBe('number');
    expect(januaryData.total_expenses).toBeCloseTo(375.50);
  });

  it('should handle categories with no transactions', async () => {
    // Add a category with no transactions
    const unusedCategory = await db.insert(categoriesTable)
      .values({ name: 'Unused Category' })
      .returning()
      .execute();
    
    const result = await getDashboardData();
    const categorySpending = result.categorySpending;
    
    const unusedCategoryData = categorySpending.find(c => c.category_id === unusedCategory[0].id);
    expect(unusedCategoryData).toBeDefined();
    expect(unusedCategoryData!.total_spent).toBe(0);
    expect(unusedCategoryData!.budget_amount).toBeNull();
  });

  it('should handle empty database', async () => {
    // Reset and recreate empty database
    await resetDB();
    await createDB();
    
    const result = await getDashboardData();
    
    expect(result.categorySpending).toEqual([]);
    expect(result.monthlySpending).toEqual([]);
  });
});
