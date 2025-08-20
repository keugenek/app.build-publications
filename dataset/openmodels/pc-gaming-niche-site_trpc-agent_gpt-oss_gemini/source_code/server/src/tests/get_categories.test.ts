import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { getCategories } from '../handlers/get_categories';
import { eq } from 'drizzle-orm';

/**
 * Helper to insert a category directly via DB for test setup.
 */
const insertCategory = async (name: string): Promise<Category> => {
  const result = await db
    .insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

describe('getCategories handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no categories exist', async () => {
    const categories = await getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toHaveLength(0);
  });

  it('should fetch all categories from the database', async () => {
    // Insert two categories
    const cat1 = await insertCategory('Electronics');
    const cat2 = await insertCategory('Books');

    const categories = await getCategories();

    // Verify length
    expect(categories).toHaveLength(2);

    // Verify each inserted category exists in the result set
    const ids = categories.map((c) => c.id);
    expect(ids).toContain(cat1.id);
    expect(ids).toContain(cat2.id);

    const fetchedCat1 = categories.find((c) => c.id === cat1.id);
    const fetchedCat2 = categories.find((c) => c.id === cat2.id);

    expect(fetchedCat1?.name).toBe('Electronics');
    expect(fetchedCat2?.name).toBe('Books');
    expect(fetchedCat1?.created_at).toBeInstanceOf(Date);
    expect(fetchedCat2?.created_at).toBeInstanceOf(Date);
  });

  it('should correctly filter categories by id using drizzle query (sanity check)', async () => {
    const cat = await insertCategory('Furniture');
    const result = await db.select().from(categoriesTable).where(eq(categoriesTable.id, cat.id)).execute();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Furniture');
  });
});
