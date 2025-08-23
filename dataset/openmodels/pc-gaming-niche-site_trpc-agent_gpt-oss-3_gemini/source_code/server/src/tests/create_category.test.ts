import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { createCategory, getCategories, updateCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

const testInput: CreateCategoryInput = {
  name: 'Gaming Accessories',
};

describe('Category handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify directly in DB
    const dbResult = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();
    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].name).toBe(testInput.name);
  });

  it('should retrieve all categories', async () => {
    // Insert two categories
    const cat1 = await createCategory({ name: 'Keyboards' });
    const cat2 = await createCategory({ name: 'Mice' });

    const all = await getCategories();
    // Ensure both created categories are present (order not guaranteed)
    const names = all.map((c) => c.name);
    expect(names).toContain('Keyboards');
    expect(names).toContain('Mice');
    // At least two categories should exist
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('should update an existing category', async () => {
    const created = await createCategory({ name: 'Old Name' });
    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'New Name',
    };
    const updated = await updateCategory(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('New Name');
    expect(updated.created_at).toBeInstanceOf(Date);

    // Verify DB reflects the change
    const dbRow = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, created.id))
      .execute();
    expect(dbRow[0].name).toBe('New Name');
  });

  it('should throw when updating a non‑existent category', async () => {
    const badUpdate: UpdateCategoryInput = { id: 9999, name: 'Does Not Exist' };
    await expect(updateCategory(badUpdate)).rejects.toThrow();
  });
});
