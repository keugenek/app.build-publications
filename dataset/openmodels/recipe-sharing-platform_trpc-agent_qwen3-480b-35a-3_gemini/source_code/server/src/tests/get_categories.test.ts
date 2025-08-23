import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert some test categories
    await db.insert(categoriesTable).values([
      { id: 1, name: 'Breakfast' },
      { id: 2, name: 'Lunch' },
      { id: 3, name: 'Dinner' },
      { id: 4, name: 'Dessert' },
      { id: 5, name: 'Appetizer' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all categories', async () => {
    const categories = await getCategories();

    expect(categories).toHaveLength(5);
    
    // Check that all expected categories are returned
    const expectedNames = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Appetizer'];
    const actualNames = categories.map(c => c.name).sort();
    expect(actualNames).toEqual(expectedNames.sort());
    
    // Check that each category has the correct structure
    categories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('createdAt');
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(category.createdAt).toBeInstanceOf(Date);
    });
  });

  it('should return categories in ascending order by id', async () => {
    const categories = await getCategories();
    
    // Check that categories are ordered by id
    for (let i = 0; i < categories.length - 1; i++) {
      expect(categories[i].id).toBeLessThan(categories[i + 1].id);
    }
  });

  it('should handle empty categories table', async () => {
    // Clear the categories table
    await db.delete(categoriesTable).execute();
    
    const categories = await getCategories();
    
    expect(categories).toHaveLength(0);
  });

  it('should not modify the database', async () => {
    const initialCount = (await db.select().from(categoriesTable).execute()).length;
    
    await getCategories();
    
    const finalCount = (await db.select().from(categoriesTable).execute()).length;
    
    expect(initialCount).toBe(finalCount);
  });
});
