import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

describe('getCategories', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test categories
    await db.insert(categoriesTable).values([
      {
        name: 'Keyboards',
        description: 'Mechanical and membrane keyboards'
      },
      {
        name: 'Mice',
        description: 'Gaming mice with high DPI'
      },
      {
        name: 'Headsets',
        description: 'Gaming headsets with surround sound'
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all categories', async () => {
    const categories = await getCategories();
    
    expect(categories).toHaveLength(3);
    
    // Verify the structure of returned categories
    categories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('created_at');
      expect(category).toHaveProperty('updated_at');
      
      // Check that dates are Date objects
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });
    
    // Verify specific category data
    const keyboards = categories.find(c => c.name === 'Keyboards');
    expect(keyboards).toBeDefined();
    expect(keyboards?.description).toBe('Mechanical and membrane keyboards');
    
    const mice = categories.find(c => c.name === 'Mice');
    expect(mice).toBeDefined();
    expect(mice?.description).toBe('Gaming mice with high DPI');
    
    const headsets = categories.find(c => c.name === 'Headsets');
    expect(headsets).toBeDefined();
    expect(headsets?.description).toBe('Gaming headsets with surround sound');
  });

  it('should return empty array when no categories exist', async () => {
    // Clear all categories
    await db.delete(categoriesTable).execute();
    
    const categories = await getCategories();
    expect(categories).toHaveLength(0);
  });

  it('should preserve category IDs and creation order', async () => {
    const categories = await getCategories();
    
    // Check that IDs are sequential (1, 2, 3)
    const ids = categories.map(c => c.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3]);
    
    // Check that categories maintain their creation order by ID
    const namesInOrder = categories
      .sort((a, b) => a.id - b.id)
      .map(c => c.name);
    expect(namesInOrder).toEqual(['Keyboards', 'Mice', 'Headsets']);
  });
});
