import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories ordered by name', async () => {
    // Create test categories in non-alphabetical order
    await db.insert(categoriesTable).values([
      { name: 'Zebra Products', description: 'Products that start with Z' },
      { name: 'Apple Products', description: 'Products that start with A' },
      { name: 'Microsoft Products', description: 'Products that start with M' }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    // Verify alphabetical ordering by name
    expect(result[0].name).toEqual('Apple Products');
    expect(result[1].name).toEqual('Microsoft Products');
    expect(result[2].name).toEqual('Zebra Products');

    // Verify all expected fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(category.description).toBeDefined(); // Can be null or string
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle categories with null descriptions', async () => {
    await db.insert(categoriesTable).values([
      { name: 'Category with Description', description: 'This has a description' },
      { name: 'Category without Description', description: null }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    const categoryWithDesc = result.find(c => c.name === 'Category with Description');
    const categoryWithoutDesc = result.find(c => c.name === 'Category without Description');

    expect(categoryWithDesc?.description).toEqual('This has a description');
    expect(categoryWithoutDesc?.description).toBeNull();
  });

  it('should return categories with proper data types', async () => {
    await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'A test category'
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
  });

  it('should maintain consistent ordering with duplicate-like names', async () => {
    // Test edge case with similar names
    await db.insert(categoriesTable).values([
      { name: 'Product Category B', description: 'Second category' },
      { name: 'Product Category A', description: 'First category' },
      { name: 'Product Category AB', description: 'Middle category' }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Product Category A');
    expect(result[1].name).toEqual('Product Category AB');
    expect(result[2].name).toEqual('Product Category B');
  });

  it('should handle large number of categories efficiently', async () => {
    // Create 50 categories with random-ish names
    const categories = Array.from({ length: 50 }, (_, i) => ({
      name: `Category ${String(i).padStart(3, '0')}`,
      description: `Description for category ${i}`
    }));

    await db.insert(categoriesTable).values(categories).execute();

    const result = await getCategories();

    expect(result).toHaveLength(50);
    
    // Verify ordering is maintained
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0);
    }
    
    // Verify all records have required fields
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toMatch(/^Category \d{3}$/);
      expect(category.description).toMatch(/^Description for category \d+$/);
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });
});
