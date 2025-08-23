import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no categories exist', async () => {
    const categories = await getCategories();
    expect(categories).toEqual([]);
  });

  it('should return all categories from the database', async () => {
    // Insert test categories
    const testCategories = [
      { name: 'Electronics' },
      { name: 'Books' },
      { name: 'Clothing' }
    ];

    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const categories = await getCategories();

    expect(categories).toHaveLength(3);
    expect(categories[0].name).toEqual('Electronics');
    expect(categories[1].name).toEqual('Books');
    expect(categories[2].name).toEqual('Clothing');

    // Verify all required fields are present
    categories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('created_at');
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return categories in the correct format', async () => {
    // Insert a test category
    await db.insert(categoriesTable)
      .values({ name: 'Test Category' })
      .execute();

    const categories = await getCategories();
    const category = categories[0];

    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
  });
});
