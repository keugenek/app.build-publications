import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type CreateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Helper function to create a test category
const createTestCategory = async (input: CreateCategoryInput) => {
  const result = await db.insert(categoriesTable)
    .values({
      name: input.name,
      color: input.color || null,
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name', async () => {
    // Create a test category first
    const testCategory = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated Category Name'
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.color).toEqual('#FF0000'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update category color', async () => {
    // Create a test category first
    const testCategory = await createTestCategory({
      name: 'Test Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      color: '#00FF00'
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.color).toEqual('#00FF00');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and color', async () => {
    // Create a test category first
    const testCategory = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated Category',
      color: '#0000FF'
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Updated Category');
    expect(result.color).toEqual('#0000FF');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set color to null', async () => {
    // Create a test category with a color
    const testCategory = await createTestCategory({
      name: 'Test Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      color: null
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create a test category first
    const testCategory = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Database Updated Category',
      color: '#FFFF00'
    };

    await updateCategory(updateInput);

    // Query the database directly to verify changes were saved
    const savedCategories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategory.id))
      .execute();

    expect(savedCategories).toHaveLength(1);
    expect(savedCategories[0].name).toEqual('Database Updated Category');
    expect(savedCategories[0].color).toEqual('#FFFF00');
    expect(savedCategories[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing category when no fields are provided to update', async () => {
    // Create a test category first
    const testCategory = await createTestCategory({
      name: 'Unchanged Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id
      // No name or color provided
    };

    const result = await updateCategory(updateInput);

    // Verify no changes were made
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Unchanged Category');
    expect(result.color).toEqual('#FF0000');
    expect(result.created_at).toEqual(testCategory.created_at);
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should handle category with null color initially', async () => {
    // Create a test category without color
    const testCategory = await createTestCategory({
      name: 'No Color Category'
      // No color provided - will be null
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated No Color Category',
      color: '#PURPLE' // Invalid but will be stored as-is
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result.id).toEqual(testCategory.id);
    expect(result.name).toEqual('Updated No Color Category');
    expect(result.color).toEqual('#PURPLE');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
