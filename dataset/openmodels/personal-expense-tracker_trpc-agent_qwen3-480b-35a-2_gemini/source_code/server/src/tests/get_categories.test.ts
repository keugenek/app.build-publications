import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert some test categories
    await db.insert(categoriesTable).values([
      { name: 'Food' },
      { name: 'Transportation' },
      { name: 'Entertainment' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should return all categories', async () => {
    const categories = await getCategories();

    expect(categories).toHaveLength(3);
    
    // Check that all expected fields are present
    categories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('created_at');
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
    });
    
    // Check specific category names
    const categoryNames = categories.map(c => c.name);
    expect(categoryNames).toContain('Food');
    expect(categoryNames).toContain('Transportation');
    expect(categoryNames).toContain('Entertainment');
  });

  it('should return categories ordered by id', async () => {
    const categories = await getCategories();
    
    // Check that categories are ordered by id
    for (let i = 0; i < categories.length - 1; i++) {
      expect(categories[i].id).toBeLessThan(categories[i + 1].id);
    }
  });

  it('should return an empty array when no categories exist', async () => {
    // Clear all categories
    await db.delete(categoriesTable).execute();
    
    const categories = await getCategories();
    expect(categories).toHaveLength(0);
  });
});
