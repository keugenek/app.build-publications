import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { getBudgets } from '../handlers/get_budgets';

describe('getBudgets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no budgets exist', async () => {
    const result = await getBudgets();
    expect(result).toEqual([]);
  });

  it('should return all budgets when no filters provided', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test budgets
    await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryId,
          amount: '1000.00',
          month: 1,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '1500.50',
          month: 2,
          year: 2024
        }
      ])
      .execute();

    const result = await getBudgets();

    expect(result).toHaveLength(2);
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].amount).toEqual(1000.00); // Should be converted to number
    expect(typeof result[0].amount).toEqual('number');
    expect(result[0].month).toEqual(1);
    expect(result[0].year).toEqual(2024);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].amount).toEqual(1500.50);
    expect(result[1].month).toEqual(2);
  });

  it('should filter budgets by year', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create budgets for different years
    await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryId,
          amount: '1000.00',
          month: 1,
          year: 2023
        },
        {
          category_id: categoryId,
          amount: '1500.00',
          month: 1,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '2000.00',
          month: 1,
          year: 2024
        }
      ])
      .execute();

    const result = await getBudgets(2024);

    expect(result).toHaveLength(2);
    result.forEach(budget => {
      expect(budget.year).toEqual(2024);
    });
  });

  it('should filter budgets by month', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create budgets for different months
    await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryId,
          amount: '1000.00',
          month: 1,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '1500.00',
          month: 2,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '2000.00',
          month: 2,
          year: 2024
        }
      ])
      .execute();

    const result = await getBudgets(undefined, 2);

    expect(result).toHaveLength(2);
    result.forEach(budget => {
      expect(budget.month).toEqual(2);
    });
  });

  it('should filter budgets by both year and month', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create budgets for different year/month combinations
    await db.insert(budgetsTable)
      .values([
        {
          category_id: categoryId,
          amount: '1000.00',
          month: 1,
          year: 2023
        },
        {
          category_id: categoryId,
          amount: '1500.00',
          month: 2,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '2000.00',
          month: 2,
          year: 2024
        },
        {
          category_id: categoryId,
          amount: '2500.00',
          month: 3,
          year: 2024
        }
      ])
      .execute();

    const result = await getBudgets(2024, 2);

    expect(result).toHaveLength(2);
    result.forEach(budget => {
      expect(budget.year).toEqual(2024);
      expect(budget.month).toEqual(2);
    });
  });

  it('should return empty array when no budgets match filters', async () => {
    // Create test category and budget
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        amount: '1000.00',
        month: 1,
        year: 2024
      })
      .execute();

    const result = await getBudgets(2025, 1); // Different year

    expect(result).toEqual([]);
  });

  it('should handle numeric conversion correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create budget with decimal amount
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        amount: '1234.56',
        month: 1,
        year: 2024
      })
      .execute();

    const result = await getBudgets();

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(1234.56);
    expect(typeof result[0].amount).toEqual('number');
  });

  it('should work with multiple categories', async () => {
    // Create multiple test categories
    const category1Result = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        color: '#FF0000'
      })
      .returning()
      .execute();
    const category1Id = category1Result[0].id;

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Transportation',
        color: '#00FF00'
      })
      .returning()
      .execute();
    const category2Id = category2Result[0].id;

    // Create budgets for different categories
    await db.insert(budgetsTable)
      .values([
        {
          category_id: category1Id,
          amount: '500.00',
          month: 1,
          year: 2024
        },
        {
          category_id: category2Id,
          amount: '300.00',
          month: 1,
          year: 2024
        }
      ])
      .execute();

    const result = await getBudgets(2024, 1);

    expect(result).toHaveLength(2);
    expect(result.some(b => b.category_id === category1Id)).toBe(true);
    expect(result.some(b => b.category_id === category2Id)).toBe(true);
  });
});
