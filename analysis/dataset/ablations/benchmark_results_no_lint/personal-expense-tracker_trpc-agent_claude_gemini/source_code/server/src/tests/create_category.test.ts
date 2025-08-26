import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputWithColor: CreateCategoryInput = {
  name: 'Test Category',
  color: '#FF5733'
};

// Test input without color
const testInputWithoutColor: CreateCategoryInput = {
  name: 'Category Without Color'
};

// Test input with null color explicitly
const testInputWithNullColor: CreateCategoryInput = {
  name: 'Category With Null Color',
  color: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with color', async () => {
    const result = await createCategory(testInputWithColor);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.color).toEqual('#FF5733');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category without color', async () => {
    const result = await createCategory(testInputWithoutColor);

    // Basic field validation
    expect(result.name).toEqual('Category Without Color');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category with explicit null color', async () => {
    const result = await createCategory(testInputWithNullColor);

    // Basic field validation
    expect(result.name).toEqual('Category With Null Color');
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database with color', async () => {
    const result = await createCategory(testInputWithColor);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].color).toEqual('#FF5733');
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database without color', async () => {
    const result = await createCategory(testInputWithoutColor);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Category Without Color');
    expect(categories[0].color).toBeNull();
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with unique IDs', async () => {
    const firstResult = await createCategory(testInputWithColor);
    const secondResult = await createCategory(testInputWithoutColor);

    // Ensure IDs are different and sequential
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(typeof firstResult.id).toEqual('number');
    expect(typeof secondResult.id).toEqual('number');

    // Verify both exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(allCategories.some(cat => cat.id === firstResult.id)).toBe(true);
    expect(allCategories.some(cat => cat.id === secondResult.id)).toBe(true);
  });

  it('should handle special characters in category name', async () => {
    const specialInput: CreateCategoryInput = {
      name: 'Food & Dining - Café/Restaurant (50%)',
      color: '#123ABC'
    };

    const result = await createCategory(specialInput);

    expect(result.name).toEqual('Food & Dining - Café/Restaurant (50%)');
    expect(result.color).toEqual('#123ABC');

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].name).toEqual('Food & Dining - Café/Restaurant (50%)');
  });

  it('should handle long category names', async () => {
    const longNameInput: CreateCategoryInput = {
      name: 'This is a very long category name that tests the ability to handle extended text input for category creation',
      color: '#FFFFFF'
    };

    const result = await createCategory(longNameInput);

    expect(result.name).toEqual(longNameInput.name);
    expect(result.color).toEqual('#FFFFFF');

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].name).toEqual(longNameInput.name);
  });
});
