import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type TransactionFilters, type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test category
  const createTestCategory = async (name: string = 'Test Category') => {
    const result = await db.insert(categoriesTable)
      .values({
        name,
        is_predefined: false
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper to create test transaction with specific timing
  const createTestTransaction = async (
    overrides: Partial<CreateTransactionInput> = {},
    categoryId?: number | null,
    delayMs: number = 0
  ) => {
    // Add small delay to ensure different timestamps if needed
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const defaults: CreateTransactionInput = {
      type: 'expense',
      amount: 50.00,
      description: 'Test transaction',
      date: new Date(),
      category_id: categoryId || null
    };

    const input = { ...defaults, ...overrides };

    const result = await db.insert(transactionsTable)
      .values({
        type: input.type,
        amount: input.amount.toString(),
        description: input.description,
        date: input.date,
        category_id: input.category_id
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should return all transactions when no filters provided', async () => {
    // Create test category and transactions with small delay to ensure order
    const category = await createTestCategory();
    await createTestTransaction({ amount: 100.00 }, category.id, 0);
    await createTestTransaction({ amount: 50.00, type: 'income' }, category.id, 1);

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    // Results should be ordered by newest first, so income (created second) should be first
    expect(result[0].amount).toEqual(50.00);
    expect(result[1].amount).toEqual(100.00);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    expect(result).toHaveLength(0);
  });

  it('should filter transactions by type', async () => {
    const category = await createTestCategory();
    await createTestTransaction({ type: 'expense', amount: 75.00 }, category.id, 0);
    await createTestTransaction({ type: 'income', amount: 100.00 }, category.id, 1);
    await createTestTransaction({ type: 'expense', amount: 25.00 }, category.id, 2);

    const filters: TransactionFilters = { type: 'expense' };
    const result = await getTransactions(filters);

    expect(result).toHaveLength(2);
    expect(result[0].type).toEqual('expense');
    expect(result[1].type).toEqual('expense');
    // Results should be ordered newest first: 25.00 (created third), then 75.00 (created first)
    expect(result[0].amount).toEqual(25.00);
    expect(result[1].amount).toEqual(75.00);
  });

  it('should filter transactions by category_id', async () => {
    const category1 = await createTestCategory('Food');
    const category2 = await createTestCategory('Transport');
    
    await createTestTransaction({ amount: 30.00 }, category1.id, 0);
    await createTestTransaction({ amount: 40.00 }, category2.id, 1);
    await createTestTransaction({ amount: 50.00 }, category1.id, 2);

    const filters: TransactionFilters = { category_id: category1.id };
    const result = await getTransactions(filters);

    expect(result).toHaveLength(2);
    expect(result[0].category_id).toEqual(category1.id);
    expect(result[1].category_id).toEqual(category1.id);
    // Results should be ordered newest first: 50.00 (created third), then 30.00 (created first)
    expect(result[0].amount).toEqual(50.00);
    expect(result[1].amount).toEqual(30.00);
  });

  it('should filter transactions by date range', async () => {
    const category = await createTestCategory();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    await createTestTransaction({ date: yesterday, amount: 10.00 }, category.id);
    await createTestTransaction({ date: today, amount: 20.00 }, category.id);
    await createTestTransaction({ date: tomorrow, amount: 30.00 }, category.id);
    await createTestTransaction({ date: dayAfterTomorrow, amount: 40.00 }, category.id);

    const filters: TransactionFilters = {
      start_date: today,
      end_date: tomorrow
    };
    const result = await getTransactions(filters);

    expect(result).toHaveLength(2);
    // Results should be ordered newest first: tomorrow (30.00), then today (20.00)
    expect(result[0].amount).toEqual(30.00);
    expect(result[1].amount).toEqual(20.00);
    expect(result[0].date >= today).toBe(true);
    expect(result[1].date <= tomorrow).toBe(true);
  });

  it('should handle pagination with limit and offset', async () => {
    const category = await createTestCategory();
    // Create transactions with different amounts and small delays
    await createTestTransaction({ amount: 10.00 }, category.id, 0);
    await createTestTransaction({ amount: 20.00 }, category.id, 1);
    await createTestTransaction({ amount: 30.00 }, category.id, 2);
    await createTestTransaction({ amount: 40.00 }, category.id, 3);
    await createTestTransaction({ amount: 50.00 }, category.id, 4);

    // Test limit only
    const limitResult = await getTransactions({ limit: 3 });
    expect(limitResult).toHaveLength(3);

    // Test offset only
    const offsetResult = await getTransactions({ offset: 2 });
    expect(offsetResult).toHaveLength(3);

    // Test limit and offset together
    const paginatedResult = await getTransactions({ limit: 2, offset: 1 });
    expect(paginatedResult).toHaveLength(2);
  });

  it('should return transactions ordered by date (newest first)', async () => {
    const category = await createTestCategory();
    const baseDate = new Date('2024-01-01');
    
    const oldDate = new Date(baseDate);
    oldDate.setDate(baseDate.getDate() - 2);
    
    const newerDate = new Date(baseDate);
    newerDate.setDate(baseDate.getDate() - 1);
    
    const newestDate = new Date(baseDate);

    await createTestTransaction({ date: oldDate, amount: 10.00 }, category.id);
    await createTestTransaction({ date: newestDate, amount: 30.00 }, category.id);
    await createTestTransaction({ date: newerDate, amount: 20.00 }, category.id);

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    // Should be ordered by date descending (newest first)
    expect(result[0].amount).toEqual(30.00); // newest
    expect(result[1].amount).toEqual(20.00); // newer
    expect(result[2].amount).toEqual(10.00); // oldest
    expect(result[0].date >= result[1].date).toBe(true);
    expect(result[1].date >= result[2].date).toBe(true);
  });

  it('should handle multiple filters combined', async () => {
    const foodCategory = await createTestCategory('Food');
    const transportCategory = await createTestCategory('Transport');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create various transactions
    await createTestTransaction({ 
      type: 'expense', 
      amount: 25.00, 
      date: today 
    }, foodCategory.id);
    await createTestTransaction({ 
      type: 'income', 
      amount: 100.00, 
      date: today 
    }, foodCategory.id);
    await createTestTransaction({ 
      type: 'expense', 
      amount: 15.00, 
      date: yesterday 
    }, foodCategory.id);
    await createTestTransaction({ 
      type: 'expense', 
      amount: 50.00, 
      date: today 
    }, transportCategory.id);

    const filters: TransactionFilters = {
      type: 'expense',
      category_id: foodCategory.id,
      start_date: today,
      limit: 10
    };

    const result = await getTransactions(filters);

    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('expense');
    expect(result[0].category_id).toEqual(foodCategory.id);
    expect(result[0].amount).toEqual(25.00);
    expect(result[0].date >= today).toBe(true);
  });

  it('should handle transactions without categories', async () => {
    const category = await createTestCategory();
    
    // Create transactions with and without categories
    await createTestTransaction({ amount: 25.00 }, category.id);
    await createTestTransaction({ amount: 50.00 }, null);
    await createTestTransaction({ amount: 75.00 }, null);

    // Get all transactions
    const allResult = await getTransactions();
    expect(allResult).toHaveLength(3);
    
    // Get specific category transactions
    const categoryResult = await getTransactions({ category_id: category.id });
    expect(categoryResult).toHaveLength(1);
    expect(categoryResult[0].amount).toEqual(25.00);
  });
});
