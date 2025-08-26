import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Electronics',
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category and return proper fields', async () => {
    const result = await createCategory(testInput);

    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toEqual(testInput.name);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the new category in the database', async () => {
    const result = await createCategory(testInput);

    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    const saved = categories[0];
    expect(saved.name).toEqual(testInput.name);
    // created_at should be a Date instance from drizzle
    expect(saved.created_at).toBeInstanceOf(Date);
  });
});
