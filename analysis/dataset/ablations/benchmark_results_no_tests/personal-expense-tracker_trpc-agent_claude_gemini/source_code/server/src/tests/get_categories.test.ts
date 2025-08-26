import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable).values([
      { name: 'Food', color: '#FF0000' },
      { name: 'Transportation', color: '#00FF00' },
      { name: 'Entertainment', color: null }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result.every(cat => cat.id)).toBe(true);
    expect(result.every(cat => cat.created_at instanceof Date)).toBe(true);
    
    // Check specific category data
    const foodCategory = result.find(cat => cat.name === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory?.color).toBe('#FF0000');
    
    const entertainmentCategory = result.find(cat => cat.name === 'Entertainment');
    expect(entertainmentCategory?.color).toBeNull();
  });

  it('should return categories ordered by name alphabetically', async () => {
    // Insert categories in random order
    await db.insert(categoriesTable).values([
      { name: 'Zebra', color: '#000000' },
      { name: 'Apple', color: '#FF0000' },
      { name: 'Banana', color: '#FFFF00' },
      { name: 'Coconut', color: '#8B4513' }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(4);
    
    // Verify alphabetical ordering
    const names = result.map(cat => cat.name);
    expect(names).toEqual(['Apple', 'Banana', 'Coconut', 'Zebra']);
  });

  it('should handle categories with null colors', async () => {
    await db.insert(categoriesTable).values([
      { name: 'Category A', color: null },
      { name: 'Category B', color: '#FF0000' },
      { name: 'Category C', color: null }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    const categoryA = result.find(cat => cat.name === 'Category A');
    const categoryB = result.find(cat => cat.name === 'Category B');
    const categoryC = result.find(cat => cat.name === 'Category C');
    
    expect(categoryA?.color).toBeNull();
    expect(categoryB?.color).toBe('#FF0000');
    expect(categoryC?.color).toBeNull();
  });

  it('should return valid category objects with all required fields', async () => {
    await db.insert(categoriesTable).values({
      name: 'Test Category',
      color: '#123456'
    }).execute();

    const result = await getCategories();
    const category = result[0];

    // Verify all required fields are present and correct types
    expect(category.id).toBeTypeOf('number');
    expect(category.name).toBeTypeOf('string');
    expect(category.color).toBeTypeOf('string');
    expect(category.created_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(category.name).toBe('Test Category');
    expect(category.color).toBe('#123456');
    expect(category.id).toBeGreaterThan(0);
  });

  it('should handle large number of categories efficiently', async () => {
    // Create 100 test categories
    const categoryData = Array.from({ length: 100 }, (_, i) => ({
      name: `Category ${i.toString().padStart(3, '0')}`,
      color: i % 2 === 0 ? `#${i.toString(16).padStart(6, '0')}` : null
    }));

    await db.insert(categoriesTable).values(categoryData).execute();

    const result = await getCategories();

    expect(result).toHaveLength(100);
    
    // Verify ordering is maintained even with large dataset
    const names = result.map(cat => cat.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
    
    // Verify all categories have required fields
    expect(result.every(cat => 
      typeof cat.id === 'number' &&
      typeof cat.name === 'string' &&
      cat.created_at instanceof Date
    )).toBe(true);
  });
});
