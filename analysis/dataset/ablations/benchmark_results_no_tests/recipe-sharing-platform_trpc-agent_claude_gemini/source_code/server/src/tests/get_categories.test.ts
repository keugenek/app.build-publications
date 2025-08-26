import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Test data
const testCategories: CreateCategoryInput[] = [
  {
    name: 'Breakfast',
    description: 'Morning meal recipes'
  },
  {
    name: 'Dessert',
    description: 'Sweet treats and desserts'
  },
  {
    name: 'Main Course',
    description: null
  }
];

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check that all categories are returned
    const categoryNames = result.map(c => c.name);
    expect(categoryNames).toContain('Breakfast');
    expect(categoryNames).toContain('Dessert');
    expect(categoryNames).toContain('Main Course');
  });

  it('should return categories with correct structure', async () => {
    // Create one test category
    await db.insert(categoriesTable)
      .values(testCategories[0])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    // Verify all required fields are present
    expect(category.id).toBeDefined();
    expect(typeof category.id).toBe('number');
    expect(category.name).toEqual('Breakfast');
    expect(category.description).toEqual('Morning meal recipes');
    expect(category.created_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    // Create category with null description
    await db.insert(categoriesTable)
      .values(testCategories[2]) // Main Course has null description
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    expect(category.name).toEqual('Main Course');
    expect(category.description).toBeNull();
  });

  it('should return categories ordered alphabetically by name', async () => {
    // Insert in non-alphabetical order
    await db.insert(categoriesTable)
      .values([
        { name: 'Zebra Category', description: null },
        { name: 'Apple Category', description: null },
        { name: 'Banana Category', description: null }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Apple Category');
    expect(result[1].name).toEqual('Banana Category');
    expect(result[2].name).toEqual('Zebra Category');
  });

  it('should handle large number of categories', async () => {
    // Create many categories
    const manyCategories = Array.from({ length: 50 }, (_, i) => ({
      name: `Category ${i.toString().padStart(2, '0')}`,
      description: `Description for category ${i}`
    }));

    await db.insert(categoriesTable)
      .values(manyCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(50);
    
    // Verify they're still ordered alphabetically
    expect(result[0].name).toEqual('Category 00');
    expect(result[49].name).toEqual('Category 49');
    
    // Check that all have proper structure
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });
});
