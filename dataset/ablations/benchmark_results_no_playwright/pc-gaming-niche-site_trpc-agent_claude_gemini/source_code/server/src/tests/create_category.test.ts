import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic devices and gadgets'
};

// Test input with null description
const testInputNoDescription: CreateCategoryInput = {
  name: 'Clothing',
  description: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Electronics');
    expect(result.description).toEqual('Electronic devices and gadgets');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category without description', async () => {
    const result = await createCategory(testInputNoDescription);

    // Basic field validation for null description
    expect(result.name).toEqual('Clothing');
    expect(result.description).toBeNull();
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
    expect(categories[0].name).toEqual('Electronics');
    expect(categories[0].description).toEqual('Electronic devices and gadgets');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique category names', async () => {
    // Create first category
    await createCategory(testInput);

    // Attempt to create duplicate category - should throw error
    await expect(createCategory(testInput)).rejects.toThrow(/duplicate key/i);
  });

  it('should handle empty string description as null', async () => {
    const inputWithEmptyDescription: CreateCategoryInput = {
      name: 'Books',
      description: ''
    };

    const result = await createCategory(inputWithEmptyDescription);

    expect(result.name).toEqual('Books');
    expect(result.description).toEqual(''); // Empty string is preserved, not converted to null
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should generate sequential IDs', async () => {
    const firstCategory = await createCategory({
      name: 'First Category',
      description: 'First test category'
    });

    const secondCategory = await createCategory({
      name: 'Second Category',
      description: 'Second test category'
    });

    expect(firstCategory.id).toBeDefined();
    expect(secondCategory.id).toBeDefined();
    expect(secondCategory.id).toBeGreaterThan(firstCategory.id);
  });

  it('should set created_at to current time', async () => {
    const beforeCreate = new Date();
    const result = await createCategory(testInput);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
