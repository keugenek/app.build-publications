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
    expect(result).toHaveLength(0);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        { name: 'Food', color: '#FF5733' },
        { name: 'Transportation', color: '#33C4FF' },
        { name: 'Entertainment', color: null }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(typeof category.id).toBe('number');
      expect(category.name).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
      // Color can be string or null
      expect(category.color === null || typeof category.color === 'string').toBe(true);
    });

    // Verify specific category data
    const categoryNames = result.map(c => c.name);
    expect(categoryNames).toContain('Food');
    expect(categoryNames).toContain('Transportation');
    expect(categoryNames).toContain('Entertainment');
  });

  it('should return categories ordered by creation date (newest first)', async () => {
    // Create categories with slight delays to ensure different timestamps
    const category1 = await db.insert(categoriesTable)
      .values({ name: 'First Category', color: '#FF0000' })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const category2 = await db.insert(categoriesTable)
      .values({ name: 'Second Category', color: '#00FF00' })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const category3 = await db.insert(categoriesTable)
      .values({ name: 'Third Category', color: '#0000FF' })
      .returning()
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify ordering: newest first (Third, Second, First)
    expect(result[0].name).toBe('Third Category');
    expect(result[1].name).toBe('Second Category');
    expect(result[2].name).toBe('First Category');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle categories with null colors correctly', async () => {
    // Create categories with mixed color values
    await db.insert(categoriesTable)
      .values([
        { name: 'Category with Color', color: '#FF5733' },
        { name: 'Category without Color', color: null }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);

    const categoryWithColor = result.find(c => c.name === 'Category with Color');
    const categoryWithoutColor = result.find(c => c.name === 'Category without Color');

    expect(categoryWithColor?.color).toBe('#FF5733');
    expect(categoryWithoutColor?.color).toBeNull();
  });

  it('should return categories with proper timestamp types', async () => {
    // Create a test category
    await db.insert(categoriesTable)
      .values({ name: 'Test Category', color: '#123456' })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    
    const category = result[0];
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (recent)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    expect(category.created_at >= fiveMinutesAgo).toBe(true);
    expect(category.updated_at >= fiveMinutesAgo).toBe(true);
    expect(category.created_at <= now).toBe(true);
    expect(category.updated_at <= now).toBe(true);
  });

  it('should handle large number of categories efficiently', async () => {
    // Create multiple categories
    const categoryData = Array.from({ length: 50 }, (_, index) => ({
      name: `Category ${index + 1}`,
      color: index % 2 === 0 ? `#${(index * 1000).toString(16).padStart(6, '0')}` : null
    }));

    await db.insert(categoriesTable)
      .values(categoryData)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(50);
    
    // Verify all categories have required properties
    result.forEach((category, index) => {
      expect(category.id).toBeDefined();
      expect(category.name).toMatch(/Category \d+/);
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    // Verify ordering is maintained (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });
});
