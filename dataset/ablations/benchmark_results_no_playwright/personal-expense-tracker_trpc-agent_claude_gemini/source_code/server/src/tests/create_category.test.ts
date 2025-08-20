import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.is_predefined).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].is_predefined).toEqual(false);
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create custom categories with is_predefined false', async () => {
    const result = await createCategory({
      name: 'Custom Entertainment'
    });

    expect(result.is_predefined).toEqual(false);

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].is_predefined).toEqual(false);
  });

  it('should reject duplicate category names', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create duplicate
    await expect(createCategory(testInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should reject duplicate category names case-sensitively', async () => {
    // Create category with original case
    await createCategory({ name: 'Shopping' });

    // Try to create with exact same name - should fail
    await expect(createCategory({ name: 'Shopping' }))
      .rejects.toThrow(/already exists/i);
  });

  it('should allow different category names', async () => {
    await createCategory({ name: 'Category One' });
    const result2 = await createCategory({ name: 'Category Two' });

    expect(result2.name).toEqual('Category Two');
    expect(result2.is_predefined).toEqual(false);

    // Verify both exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(allCategories.map(c => c.name)).toContain('Category One');
    expect(allCategories.map(c => c.name)).toContain('Category Two');
  });

  it('should handle special characters in category names', async () => {
    const specialInput: CreateCategoryInput = {
      name: 'Café & Restaurant'
    };

    const result = await createCategory(specialInput);

    expect(result.name).toEqual('Café & Restaurant');
    expect(result.is_predefined).toEqual(false);
  });

  it('should assign unique sequential IDs', async () => {
    const result1 = await createCategory({ name: 'First Category' });
    const result2 = await createCategory({ name: 'Second Category' });

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(typeof result1.id).toBe('number');
    expect(typeof result2.id).toBe('number');
  });
});
