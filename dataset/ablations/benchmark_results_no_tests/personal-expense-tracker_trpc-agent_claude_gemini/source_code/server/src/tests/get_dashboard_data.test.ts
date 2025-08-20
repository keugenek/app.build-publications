import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { type DashboardQuery } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test data
  const setupTestData = async () => {
    // Create categories
    const categoriesResult = await db.insert(categoriesTable)
      .values([
        { name: 'Groceries', color: '#FF5733' },
        { name: 'Entertainment', color: '#33FF57' },
        { name: 'Salary', color: '#3357FF' }
      ])
      .returning()
      .execute();

    const groceryId = categoriesResult[0].id;
    const entertainmentId = categoriesResult[1].id;
    const salaryId = categoriesResult[2].id;

    // Create transactions for testing
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(transactionsTable)
      .values([
        // Income transactions
        {
          amount: '3000.00',
          date: today,
          description: 'Monthly salary',
          type: 'income',
          category_id: salaryId
        },
        {
          amount: '500.00',
          date: yesterday,
          description: 'Freelance work',
          type: 'income',
          category_id: salaryId
        },
        // Expense transactions
        {
          amount: '150.00',
          date: today,
          description: 'Weekly groceries',
          type: 'expense',
          category_id: groceryId
        },
        {
          amount: '80.00',
          date: yesterday,
          description: 'Movie night',
          type: 'expense',
          category_id: entertainmentId
        },
        {
          amount: '120.00',
          date: twoDaysAgo,
          description: 'More groceries',
          type: 'expense',
          category_id: groceryId
        }
      ])
      .execute();

    return { groceryId, entertainmentId, salaryId };
  };

  it('should return dashboard data with default date range (current month)', async () => {
    await setupTestData();

    const query: DashboardQuery = {};
    const result = await getDashboardData(query);

    // Verify structure
    expect(result.categoryBreakdown).toBeDefined();
    expect(result.spendingTrends).toBeDefined();
    expect(result.totalIncome).toBeDefined();
    expect(result.totalExpenses).toBeDefined();
    expect(result.netAmount).toBeDefined();

    // Verify totals
    expect(result.totalIncome).toEqual(3500); // 3000 + 500
    expect(result.totalExpenses).toEqual(350); // 150 + 80 + 120
    expect(result.netAmount).toEqual(3150); // 3500 - 350

    // Verify category breakdown has data
    expect(result.categoryBreakdown.length).toBeGreaterThan(0);
    
    // Find salary category (highest amount)
    const salaryCategory = result.categoryBreakdown.find(cat => cat.category_name === 'Salary');
    expect(salaryCategory).toBeDefined();
    expect(salaryCategory?.total_amount).toEqual(3500);
    expect(salaryCategory?.transaction_count).toEqual(2);
    expect(salaryCategory?.category_color).toEqual('#3357FF');

    // Find groceries category
    const groceriesCategory = result.categoryBreakdown.find(cat => cat.category_name === 'Groceries');
    expect(groceriesCategory).toBeDefined();
    expect(groceriesCategory?.total_amount).toEqual(270); // 150 + 120
    expect(groceriesCategory?.transaction_count).toEqual(2);

    // Verify spending trends has data
    expect(result.spendingTrends.length).toBeGreaterThan(0);
  });

  it('should filter data by date range correctly', async () => {
    await setupTestData();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Query only for today and yesterday (excluding two days ago)
    const query: DashboardQuery = {
      startDate: yesterday,
      endDate: today
    };

    const result = await getDashboardData(query);

    // Should exclude the transaction from two days ago (120.00 groceries)
    expect(result.totalIncome).toEqual(3500); // All income is within range
    expect(result.totalExpenses).toEqual(230); // 150 + 80 (excluding 120 from two days ago)
    expect(result.netAmount).toEqual(3270); // 3500 - 230

    // Groceries category should only have one transaction
    const groceriesCategory = result.categoryBreakdown.find(cat => cat.category_name === 'Groceries');
    expect(groceriesCategory?.total_amount).toEqual(150); // Only today's groceries
    expect(groceriesCategory?.transaction_count).toEqual(1);
  });

  it('should handle date range with no transactions', async () => {
    await setupTestData();

    // Query for next month (should have no transactions)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endOfNextMonth = new Date(nextMonth);
    endOfNextMonth.setMonth(endOfNextMonth.getMonth() + 1);

    const query: DashboardQuery = {
      startDate: nextMonth,
      endDate: endOfNextMonth
    };

    const result = await getDashboardData(query);

    expect(result.totalIncome).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netAmount).toEqual(0);
    expect(result.categoryBreakdown).toHaveLength(0);
    expect(result.spendingTrends).toHaveLength(0);
  });

  it('should calculate spending trends by day correctly', async () => {
    await setupTestData();

    const query: DashboardQuery = {};
    const result = await getDashboardData(query);

    expect(result.spendingTrends.length).toBeGreaterThan(0);

    // Find today's trend data
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const todayTrend = result.spendingTrends.find(trend => trend.date === todayStr);

    if (todayTrend) {
      expect(todayTrend.income).toEqual(3000); // Salary today
      expect(todayTrend.expenses).toEqual(150); // Groceries today
      expect(todayTrend.net).toEqual(2850); // 3000 - 150
    }

    // Verify all trends have proper net calculation
    result.spendingTrends.forEach(trend => {
      expect(trend.net).toEqual(trend.income - trend.expenses);
    });
  });

  it('should order category breakdown by total amount (descending)', async () => {
    await setupTestData();

    const query: DashboardQuery = {};
    const result = await getDashboardData(query);

    expect(result.categoryBreakdown.length).toBeGreaterThan(1);

    // Should be ordered by amount descending
    // Salary (3500) > Groceries (270) > Entertainment (80)
    expect(result.categoryBreakdown[0].category_name).toEqual('Salary');
    expect(result.categoryBreakdown[0].total_amount).toEqual(3500);
    
    if (result.categoryBreakdown.length > 1) {
      expect(result.categoryBreakdown[1].category_name).toEqual('Groceries');
      expect(result.categoryBreakdown[1].total_amount).toEqual(270);
    }
  });

  it('should handle empty database', async () => {
    // No test data setup - empty database

    const query: DashboardQuery = {};
    const result = await getDashboardData(query);

    expect(result.totalIncome).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netAmount).toEqual(0);
    expect(result.categoryBreakdown).toHaveLength(0);
    expect(result.spendingTrends).toHaveLength(0);
  });

  it('should handle single date range (same start and end date)', async () => {
    await setupTestData();

    const today = new Date();
    const query: DashboardQuery = {
      startDate: today,
      endDate: today
    };

    const result = await getDashboardData(query);

    // Should only include today's transactions
    expect(result.totalIncome).toEqual(3000); // Only today's salary
    expect(result.totalExpenses).toEqual(150); // Only today's groceries
    expect(result.netAmount).toEqual(2850);

    // Should have only one spending trend entry
    expect(result.spendingTrends).toHaveLength(1);
    expect(result.spendingTrends[0].income).toEqual(3000);
    expect(result.spendingTrends[0].expenses).toEqual(150);
  });
});
