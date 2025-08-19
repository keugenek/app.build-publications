import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing purposes'
};

const testInputNullDescription: CreateCategoryInput = {
  name: 'Category Without Description',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.description).toEqual('A category for testing purposes');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with null description', async () => {
    const result = await createCategory(testInputNullDescription);

    expect(result.name).toEqual('Category Without Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
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
    expect(categories[0].description).toEqual('A category for testing purposes');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with unique IDs', async () => {
    const firstCategory = await createCategory({
      name: 'First Category',
      description: 'First test category'
    });

    const secondCategory = await createCategory({
      name: 'Second Category',
      description: 'Second test category'
    });

    // IDs should be different
    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.name).toEqual('First Category');
    expect(secondCategory.name).toEqual('Second Category');

    // Verify both exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    const categoryNames = allCategories.map(c => c.name);
    expect(categoryNames).toContain('First Category');
    expect(categoryNames).toContain('Second Category');
  });

  it('should handle special characters in name and description', async () => {
    const specialInput: CreateCategoryInput = {
      name: "Category with 'quotes' & symbols",
      description: 'Description with "double quotes" and émojis 🎉'
    };

    const result = await createCategory(specialInput);

    expect(result.name).toEqual("Category with 'quotes' & symbols");
    expect(result.description).toEqual('Description with "double quotes" and émojis 🎉');

    // Verify in database
    const savedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(savedCategory[0].name).toEqual("Category with 'quotes' & symbols");
    expect(savedCategory[0].description).toEqual('Description with "double quotes" and émojis 🎉');
  });
});
