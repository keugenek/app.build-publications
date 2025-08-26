import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { type DashboardQuery } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test categories
  const createTestCategories = async () => {
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Food', color: '#FF5722' },
        { name: 'Transport', color: '#2196F3' },
        { name: 'Entertainment', color: '#9C27B0' }
      ])
      .returning()
      .execute();
    return categories;
  };

  // Helper function to create test transactions
  const createTestTransactions = async (categoryIds: number[]) => {
    const transactions = await db.insert(transactionsTable)
      .values([
        {
          amount: '100.00',
          description: 'Salary',
          type: 'income',
          category_id: categoryIds[0],
          transaction_date: new Date('2024-01-15')
        },
        {
          amount: '50.00',
          description: 'Groceries',
          type: 'expense',
          category_id: categoryIds[0],
          transaction_date: new Date('2024-01-16')
        },
        {
          amount: '30.00',
          description: 'Bus ticket',
          type: 'expense',
          category_id: categoryIds[1],
          transaction_date: new Date('2024-01-17')
        },
        {
          amount: '25.00',
          description: 'Movie ticket',
          type: 'expense',
          category_id: categoryIds[2],
          transaction_date: new Date('2024-01-18')
        },
        {
          amount: '200.00',
          description: 'Freelance',
          type: 'income',
          category_id: categoryIds[1],
          transaction_date: new Date('2024-02-10')
        },
        {
          amount: '75.00',
          description: 'Restaurant',
          type: 'expense',
          category_id: categoryIds[0],
          transaction_date: new Date('2024-02-12')
        }
      ])
      .returning()
      .execute();
    return transactions;
  };

  // Helper function to create test budgets
  const createTestBudgets = async (categoryIds: number[]) => {
    const budgets = await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryIds[0],
          monthly_limit: '200.00',
          month: 1,
          year: 2024
        },
        {
          category_id: categoryIds[1],
          monthly_limit: '100.00',
          month: 1,
          year: 2024
        },
        {
          category_id: categoryIds[2],
          monthly_limit: '50.00',
          month: 1,
          year: 2024
        }
      ])
      .returning()
      .execute();
    return budgets;
  };

  it('should return dashboard data with no filters', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);
    await createTestTransactions(categoryIds);
    await createTestBudgets(categoryIds);

    const result = await getDashboardData({});

    // Check basic structure
    expect(result).toHaveProperty('category_spending');
    expect(result).toHaveProperty('monthly_trends');
    expect(result).toHaveProperty('total_income');
    expect(result).toHaveProperty('total_expenses');
    expect(result).toHaveProperty('net_amount');
    expect(result).toHaveProperty('budget_status');

    // Check totals
    expect(result.total_income).toBe(300); // 100 + 200
    expect(result.total_expenses).toBe(180); // 50 + 30 + 25 + 75
    expect(result.net_amount).toBe(120); // 300 - 180

    // Check category spending (expenses only)
    expect(result.category_spending).toHaveLength(3);
    const foodSpending = result.category_spending.find(c => c.category_name === 'Food');
    expect(foodSpending?.total_amount).toBe(125); // 50 + 75
    expect(foodSpending?.transaction_count).toBe(2);

    // Check monthly trends
    expect(result.monthly_trends).toHaveLength(2);
    const jan2024 = result.monthly_trends.find(t => t.month === 1 && t.year === 2024);
    expect(jan2024?.total_income).toBe(100);
    expect(jan2024?.total_expenses).toBe(105); // 50 + 30 + 25
    expect(jan2024?.net_amount).toBe(-5);

    const feb2024 = result.monthly_trends.find(t => t.month === 2 && t.year === 2024);
    expect(feb2024?.total_income).toBe(200);
    expect(feb2024?.total_expenses).toBe(75);
    expect(feb2024?.net_amount).toBe(125);

    // Check budget status
    expect(result.budget_status).toHaveLength(3);
    const foodBudget = result.budget_status.find(b => b.category_name === 'Food');
    expect(foodBudget?.budget_limit).toBe(200);
    expect(foodBudget?.spent_amount).toBe(50); // Only January expenses for January budget
    expect(foodBudget?.remaining_amount).toBe(150);
    expect(foodBudget?.percentage_used).toBe(25);
  });

  it('should filter by date range', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);
    await createTestTransactions(categoryIds);

    const query: DashboardQuery = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getDashboardData(query);

    // Should only include January transactions
    expect(result.total_income).toBe(100);
    expect(result.total_expenses).toBe(105); // 50 + 30 + 25
    expect(result.net_amount).toBe(-5);

    // Should only have January trend
    expect(result.monthly_trends).toHaveLength(1);
    expect(result.monthly_trends[0].month).toBe(1);
    expect(result.monthly_trends[0].year).toBe(2024);
  });

  it('should filter by specific month and year', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);
    await createTestTransactions(categoryIds);
    await createTestBudgets(categoryIds);

    const query: DashboardQuery = {
      month: 2,
      year: 2024
    };

    const result = await getDashboardData(query);

    // Should only include February transactions
    expect(result.total_income).toBe(200);
    expect(result.total_expenses).toBe(75);
    expect(result.net_amount).toBe(125);

    // Should only have February trend
    expect(result.monthly_trends).toHaveLength(1);
    expect(result.monthly_trends[0].month).toBe(2);
    expect(result.monthly_trends[0].year).toBe(2024);

    // Category spending should only include February expenses
    expect(result.category_spending).toHaveLength(1);
    const foodSpending = result.category_spending.find(c => c.category_name === 'Food');
    expect(foodSpending?.total_amount).toBe(75);

    // Budget status should be empty since we only have January budgets
    expect(result.budget_status).toHaveLength(0);
  });

  it('should handle empty data gracefully', async () => {
    const result = await getDashboardData({});

    expect(result.category_spending).toHaveLength(0);
    expect(result.monthly_trends).toHaveLength(0);
    expect(result.total_income).toBe(0);
    expect(result.total_expenses).toBe(0);
    expect(result.net_amount).toBe(0);
    expect(result.budget_status).toHaveLength(0);
  });

  it('should calculate budget status correctly for multiple budgets', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);
    
    // Create January transactions
    await db.insert(transactionsTable)
      .values([
        {
          amount: '150.00',
          description: 'Food expense',
          type: 'expense',
          category_id: categoryIds[0],
          transaction_date: new Date('2024-01-15')
        },
        {
          amount: '80.00',
          description: 'Transport expense',
          type: 'expense',
          category_id: categoryIds[1],
          transaction_date: new Date('2024-01-16')
        },
        {
          amount: '25.00',
          description: 'Entertainment expense',
          type: 'expense',
          category_id: categoryIds[2],
          transaction_date: new Date('2024-01-17')
        }
      ])
      .execute();

    await createTestBudgets(categoryIds);

    const query: DashboardQuery = {
      month: 1,
      year: 2024
    };

    const result = await getDashboardData(query);

    expect(result.budget_status).toHaveLength(3);

    // Food budget: 150/200 = 75%
    const foodBudget = result.budget_status.find(b => b.category_name === 'Food');
    expect(foodBudget?.spent_amount).toBe(150);
    expect(foodBudget?.remaining_amount).toBe(50);
    expect(foodBudget?.percentage_used).toBe(75);

    // Transport budget: 80/100 = 80%
    const transportBudget = result.budget_status.find(b => b.category_name === 'Transport');
    expect(transportBudget?.spent_amount).toBe(80);
    expect(transportBudget?.remaining_amount).toBe(20);
    expect(transportBudget?.percentage_used).toBe(80);

    // Entertainment budget: 25/50 = 50%
    const entertainmentBudget = result.budget_status.find(b => b.category_name === 'Entertainment');
    expect(entertainmentBudget?.spent_amount).toBe(25);
    expect(entertainmentBudget?.remaining_amount).toBe(25);
    expect(entertainmentBudget?.percentage_used).toBe(50);
  });

  it('should handle income-only transactions correctly', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);

    // Create only income transactions
    await db.insert(transactionsTable)
      .values([
        {
          amount: '1000.00',
          description: 'Salary',
          type: 'income',
          category_id: categoryIds[0],
          transaction_date: new Date('2024-01-15')
        },
        {
          amount: '500.00',
          description: 'Bonus',
          type: 'income',
          category_id: categoryIds[1],
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await getDashboardData({});

    expect(result.total_income).toBe(1500);
    expect(result.total_expenses).toBe(0);
    expect(result.net_amount).toBe(1500);
    expect(result.category_spending).toHaveLength(0); // No expenses
  });

  it('should return correct data types', async () => {
    const categories = await createTestCategories();
    const categoryIds = categories.map(c => c.id);
    await createTestTransactions(categoryIds);
    await createTestBudgets(categoryIds);

    const result = await getDashboardData({});

    // Verify numeric types
    expect(typeof result.total_income).toBe('number');
    expect(typeof result.total_expenses).toBe('number');
    expect(typeof result.net_amount).toBe('number');

    // Verify array structures
    expect(Array.isArray(result.category_spending)).toBe(true);
    expect(Array.isArray(result.monthly_trends)).toBe(true);
    expect(Array.isArray(result.budget_status)).toBe(true);

    // Verify category spending structure
    if (result.category_spending.length > 0) {
      const categorySpending = result.category_spending[0];
      expect(typeof categorySpending.category_id).toBe('number');
      expect(typeof categorySpending.category_name).toBe('string');
      expect(typeof categorySpending.total_amount).toBe('number');
      expect(typeof categorySpending.transaction_count).toBe('number');
    }

    // Verify monthly trends structure
    if (result.monthly_trends.length > 0) {
      const monthlyTrend = result.monthly_trends[0];
      expect(typeof monthlyTrend.month).toBe('number');
      expect(typeof monthlyTrend.year).toBe('number');
      expect(typeof monthlyTrend.total_income).toBe('number');
      expect(typeof monthlyTrend.total_expenses).toBe('number');
      expect(typeof monthlyTrend.net_amount).toBe('number');
    }

    // Verify budget status structure
    if (result.budget_status.length > 0) {
      const budgetStatus = result.budget_status[0];
      expect(typeof budgetStatus.category_id).toBe('number');
      expect(typeof budgetStatus.category_name).toBe('string');
      expect(typeof budgetStatus.budget_limit).toBe('number');
      expect(typeof budgetStatus.spent_amount).toBe('number');
      expect(typeof budgetStatus.remaining_amount).toBe('number');
      expect(typeof budgetStatus.percentage_used).toBe('number');
    }
  });
});
