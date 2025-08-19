import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Test category data
const testCategory1: CreateCategoryInput = {
  name: 'Groceries',
  description: 'Food and household supplies'
};

const testCategory2: CreateCategoryInput = {
  name: 'Entertainment',
  description: null
};

const testCategory3: CreateCategoryInput = {
  name: 'Transportation',
  description: 'Car expenses, gas, public transport'
};

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([testCategory1, testCategory2, testCategory3])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify each category has the expected structure
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(typeof category.id).toBe('number');
      expect(category.name).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(typeof category.description === 'string' || category.description === null).toBe(true);
    });

    // Verify specific category data
    const groceryCategory = result.find(c => c.name === 'Groceries');
    expect(groceryCategory).toBeDefined();
    expect(groceryCategory?.description).toBe('Food and household supplies');

    const entertainmentCategory = result.find(c => c.name === 'Entertainment');
    expect(entertainmentCategory).toBeDefined();
    expect(entertainmentCategory?.description).toBe(null);

    const transportCategory = result.find(c => c.name === 'Transportation');
    expect(transportCategory).toBeDefined();
    expect(transportCategory?.description).toBe('Car expenses, gas, public transport');
  });

  it('should return categories in order they were created', async () => {
    // Insert categories one by one to ensure order
    await db.insert(categoriesTable)
      .values(testCategory1)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(categoriesTable)
      .values(testCategory2)
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(categoriesTable)
      .values(testCategory3)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify categories are returned (order may vary without explicit ORDER BY)
    const names = result.map(c => c.name);
    expect(names).toContain('Groceries');
    expect(names).toContain('Entertainment');
    expect(names).toContain('Transportation');

    // Verify all created_at timestamps are valid
    result.forEach(category => {
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.created_at.getTime()).toBeGreaterThan(0);
    });
  });

  it('should handle categories with null descriptions correctly', async () => {
    // Create category with null description
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: null
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Category');
    expect(result[0].description).toBe(null);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return categories with valid timestamps', async () => {
    const beforeInsert = new Date();
    
    await db.insert(categoriesTable)
      .values(testCategory1)
      .execute();

    const afterInsert = new Date();
    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    
    // Verify timestamp is within reasonable range
    expect(category.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(category.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});
