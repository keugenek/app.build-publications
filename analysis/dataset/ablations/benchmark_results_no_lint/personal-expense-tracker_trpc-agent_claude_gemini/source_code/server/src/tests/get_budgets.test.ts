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

  it('should return all budgets', async () => {
    // Create a test category first (required for foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test budgets
    const testBudgets = [
      {
        category_id: categoryId,
        monthly_limit: '500.00',
        month: 1,
        year: 2024
      },
      {
        category_id: categoryId,
        monthly_limit: '1000.50',
        month: 2,
        year: 2024
      }
    ];

    await db.insert(budgetsTable)
      .values(testBudgets)
      .execute();

    // Test the handler
    const result = await getBudgets();

    expect(result).toHaveLength(2);
    
    // Verify first budget
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].monthly_limit).toEqual(500.00);
    expect(typeof result[0].monthly_limit).toEqual('number');
    expect(result[0].month).toEqual(1);
    expect(result[0].year).toEqual(2024);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second budget
    expect(result[1].category_id).toEqual(categoryId);
    expect(result[1].monthly_limit).toEqual(1000.50);
    expect(typeof result[1].monthly_limit).toEqual('number');
    expect(result[1].month).toEqual(2);
    expect(result[1].year).toEqual(2024);
  });

  it('should handle single budget correctly', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Entertainment',
        color: '#00FF00'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create single test budget
    await db.insert(budgetsTable)
      .values({
        category_id: categoryId,
        monthly_limit: '250.75',
        month: 6,
        year: 2023
      })
      .execute();

    const result = await getBudgets();

    expect(result).toHaveLength(1);
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].monthly_limit).toEqual(250.75);
    expect(result[0].month).toEqual(6);
    expect(result[0].year).toEqual(2023);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should convert numeric fields correctly', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Utilities',
        color: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Test with various numeric values
    const testBudgets = [
      {
        category_id: categoryId,
        monthly_limit: '0.01', // Very small amount
        month: 1,
        year: 2024
      },
      {
        category_id: categoryId,
        monthly_limit: '9999.99', // Large amount
        month: 12,
        year: 2024
      }
    ];

    await db.insert(budgetsTable)
      .values(testBudgets)
      .execute();

    const result = await getBudgets();

    expect(result).toHaveLength(2);
    
    // Verify numeric conversion
    expect(typeof result[0].monthly_limit).toEqual('number');
    expect(result[0].monthly_limit).toEqual(0.01);
    
    expect(typeof result[1].monthly_limit).toEqual('number');
    expect(result[1].monthly_limit).toEqual(9999.99);
  });
});
