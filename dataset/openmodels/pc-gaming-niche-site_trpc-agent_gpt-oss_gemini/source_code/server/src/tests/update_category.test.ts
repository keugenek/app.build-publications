import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';

describe('updateCategory handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update the name of an existing category', async () => {
    // Insert a category directly
    const [inserted] = await db
      .insert(categoriesTable)
      .values({ name: 'Original Name' })
      .returning()
      .execute();

    const input: UpdateCategoryInput = {
      id: inserted.id,
      name: 'Updated Name',
    };

    const result = await updateCategory(input);

    expect(result.id).toBe(inserted.id);
    expect(result.name).toBe('Updated Name');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify DB reflects the change
    const [dbRecord] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, inserted.id))
      .execute();
    expect(dbRecord.name).toBe('Updated Name');
  });

  it('should return existing category when no fields to update are provided', async () => {
    const [inserted] = await db
      .insert(categoriesTable)
      .values({ name: 'Only Name' })
      .returning()
      .execute();

    const input: UpdateCategoryInput = {
      id: inserted.id,
    };

    const result = await updateCategory(input);
    expect(result.id).toBe(inserted.id);
    expect(result.name).toBe('Only Name');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non‑existent category', async () => {
    const input: UpdateCategoryInput = {
      id: 9999,
      name: 'Does Not Exist',
    };

    await expect(updateCategory(input)).rejects.toThrow(/Category with id 9999 not found/);
  });
});
