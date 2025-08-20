import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';
import { predefinedCategoryNames } from '../schema';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable).values([
      { name: 'Transportation', is_predefined: true },
      { name: 'Custom Category', is_predefined: false },
      { name: 'Food & Dining', is_predefined: true }
    ]);

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(typeof category.is_predefined).toBe('boolean');
      expect(category.created_at).toBeInstanceOf(Date);
    });

    // Check specific categories exist
    const categoryNames = result.map(c => c.name);
    expect(categoryNames).toContain('Transportation');
    expect(categoryNames).toContain('Custom Category');
    expect(categoryNames).toContain('Food & Dining');
  });

  it('should return categories ordered by name', async () => {
    // Insert categories in non-alphabetical order
    await db.insert(categoriesTable).values([
      { name: 'Zebra Category', is_predefined: false },
      { name: 'Alpha Category', is_predefined: true },
      { name: 'Beta Category', is_predefined: false },
      { name: 'Charlie Category', is_predefined: true }
    ]);

    const result = await getCategories();

    expect(result).toHaveLength(4);
    
    // Verify alphabetical ordering
    const names = result.map(c => c.name);
    expect(names).toEqual([
      'Alpha Category',
      'Beta Category', 
      'Charlie Category',
      'Zebra Category'
    ]);
  });

  it('should distinguish between predefined and custom categories', async () => {
    // Create both predefined and custom categories
    await db.insert(categoriesTable).values([
      { name: 'Food', is_predefined: true },
      { name: 'My Custom Category', is_predefined: false },
      { name: 'Transport', is_predefined: true }
    ]);

    const result = await getCategories();

    expect(result).toHaveLength(3);

    const predefinedCategories = result.filter(c => c.is_predefined);
    const customCategories = result.filter(c => !c.is_predefined);

    expect(predefinedCategories).toHaveLength(2);
    expect(customCategories).toHaveLength(1);

    expect(predefinedCategories.map(c => c.name)).toEqual(['Food', 'Transport']);
    expect(customCategories[0].name).toEqual('My Custom Category');
  });

  it('should handle categories with special characters in names', async () => {
    // Create categories with special characters
    await db.insert(categoriesTable).values([
      { name: 'Café & Restaurants', is_predefined: false },
      { name: 'Health & Medicine', is_predefined: true },
      { name: 'Books/Education', is_predefined: false },
      { name: 'Pets (Veterinary)', is_predefined: false }
    ]);

    const result = await getCategories();

    expect(result).toHaveLength(4);
    
    const names = result.map(c => c.name);
    expect(names).toContain('Café & Restaurants');
    expect(names).toContain('Health & Medicine');
    expect(names).toContain('Books/Education');
    expect(names).toContain('Pets (Veterinary)');

    // Verify still ordered alphabetically
    expect(names[0]).toEqual('Books/Education');
    expect(names[1]).toEqual('Café & Restaurants');
    expect(names[2]).toEqual('Health & Medicine');
    expect(names[3]).toEqual('Pets (Veterinary)');
  });

  it('should handle large number of categories efficiently', async () => {
    // Create many categories to test performance
    const manyCategories = Array.from({ length: 50 }, (_, i) => ({
      name: `Category ${String(i + 1).padStart(3, '0')}`,
      is_predefined: i % 2 === 0
    }));

    await db.insert(categoriesTable).values(manyCategories);

    const result = await getCategories();

    expect(result).toHaveLength(50);
    
    // Verify they're still ordered
    for (let i = 1; i < result.length; i++) {
      expect(result[i-1].name <= result[i].name).toBe(true);
    }

    // Verify mix of predefined and custom
    const predefinedCount = result.filter(c => c.is_predefined).length;
    const customCount = result.filter(c => !c.is_predefined).length;
    expect(predefinedCount).toEqual(25);
    expect(customCount).toEqual(25);
  });
});
