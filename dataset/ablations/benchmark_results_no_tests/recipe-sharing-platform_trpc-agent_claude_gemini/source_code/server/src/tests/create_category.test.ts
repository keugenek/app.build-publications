import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateCategoryInput = {
  name: 'Italian Cuisine',
  description: 'Traditional Italian recipes and cooking techniques'
};

const testInputWithNullDescription: CreateCategoryInput = {
  name: 'Quick Meals',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Italian Cuisine');
    expect(result.description).toEqual('Traditional Italian recipes and cooking techniques');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with null description', async () => {
    const result = await createCategory(testInputWithNullDescription);

    expect(result.name).toEqual('Quick Meals');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
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
    expect(categories[0].name).toEqual('Italian Cuisine');
    expect(categories[0].description).toEqual('Traditional Italian recipes and cooking techniques');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique constraint violation for duplicate names', async () => {
    // Create first category
    await createCategory(testInput);

    // Attempt to create category with same name should fail
    await expect(createCategory(testInput)).rejects.toThrow(/duplicate/i);
  });

  it('should create multiple categories with different names', async () => {
    const firstCategory = await createCategory(testInput);
    const secondCategory = await createCategory(testInputWithNullDescription);

    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.name).toEqual('Italian Cuisine');
    expect(secondCategory.name).toEqual('Quick Meals');

    // Verify both exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(allCategories.map(c => c.name)).toContain('Italian Cuisine');
    expect(allCategories.map(c => c.name)).toContain('Quick Meals');
  });

  it('should auto-generate created_at timestamp', async () => {
    const beforeCreation = new Date();
    const result = await createCategory(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });
});
