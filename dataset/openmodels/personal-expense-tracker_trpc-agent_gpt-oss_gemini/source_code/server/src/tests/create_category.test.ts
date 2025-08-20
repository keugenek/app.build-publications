import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory, getCategories } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

const testInput: CreateCategoryInput = {
  name: 'Test Category',
};

describe('Category Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with correct fields', async () => {
    const result = await createCategory(testInput);
    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist created category to the database', async () => {
    const created = await createCategory(testInput);
    const rows = await db.select().from(categoriesTable).where(eq(categoriesTable.id, created.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(testInput.name);
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('getCategories should return all categories', async () => {
    const cat1 = await createCategory({ name: 'Cat1' });
    const cat2 = await createCategory({ name: 'Cat2' });
    const all = await getCategories();
    const names = all.map(c => c.name);
    expect(names).toContain('Cat1');
    expect(names).toContain('Cat2');
    // Ensure both created categories are present
    expect(all.find(c => c.id === cat1.id)).toBeDefined();
    expect(all.find(c => c.id === cat2.id)).toBeDefined();
  });
});
