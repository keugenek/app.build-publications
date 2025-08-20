import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF5733'
};

// Test input without color
const testInputNoColor: CreateCategoryInput = {
  name: 'Category No Color'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with color', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.color).toEqual('#FF5733');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category without color', async () => {
    const result = await createCategory(testInputNoColor);

    // Basic field validation
    expect(result.name).toEqual('Category No Color');
    expect(result.color).toBeNull();
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
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].color).toEqual('#FF5733');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null color field correctly', async () => {
    const result = await createCategory(testInputNoColor);

    // Query database to verify null handling
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Category No Color');
    expect(categories[0].color).toBeNull();
  });

  it('should prevent duplicate category names', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create another category with same name
    const duplicateInput: CreateCategoryInput = {
      name: 'Test Category',
      color: '#000000'
    };

    await expect(createCategory(duplicateInput))
      .rejects
      .toThrow(/already exists/i);
  });

  it('should allow different category names', async () => {
    // Create first category
    const firstCategory = await createCategory(testInput);

    // Create second category with different name
    const secondInput: CreateCategoryInput = {
      name: 'Different Category',
      color: '#00FF00'
    };
    const secondCategory = await createCategory(secondInput);

    // Both should exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.name).toEqual('Test Category');
    expect(secondCategory.name).toEqual('Different Category');
  });

  it('should validate required fields', async () => {
    const invalidInput = {
      name: '', // Empty name should be caught by Zod validation
      color: '#FF0000'
    } as CreateCategoryInput;

    // This would typically be caught by Zod validation before reaching the handler
    // But we can test the handler behavior with empty string
    await expect(createCategory(invalidInput))
      .rejects
      .toThrow();
  });
});
