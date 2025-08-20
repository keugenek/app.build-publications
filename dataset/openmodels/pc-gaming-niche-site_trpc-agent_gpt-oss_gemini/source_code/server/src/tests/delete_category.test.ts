import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { deleteCategory } from '../handlers/delete_category';
import { type Category } from '../schema';

/** Helper to create a category */
const insertCategory = async (name: string): Promise<Category> => {
  const result = await db
    .insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  const row = result[0];
  return {
    ...row,
    created_at: new Date(row.created_at),
  } as Category;
};

describe('deleteCategory handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('deletes an existing category and returns it', async () => {
    const inserted = await insertCategory('Test Category');
    const deleted = await deleteCategory(inserted.id);

    expect(deleted.id).toBe(inserted.id);
    expect(deleted.name).toBe('Test Category');
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Verify it no longer exists in DB
    const remaining = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, inserted.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('throws an error when category does not exist', async () => {
    await expect(deleteCategory(9999)).rejects.toThrow('Category not found');
  });
});
