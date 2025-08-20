import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type CreateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Helper function to create a test category
const createTestCategory = async (categoryData: CreateCategoryInput) => {
  const result = await db.insert(categoriesTable)
    .values({
      name: categoryData.name,
      color: categoryData.color || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Category Name'
    };

    const result = await updateCategory(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Updated Category Name');
    expect(result.color).toEqual('#FF0000'); // Should remain unchanged
    expect(result.id).toEqual(category.id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should update category color', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Test Category',
      color: '#FF0000'
    });

    // Add small delay to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      color: '#00FF00'
    };

    const result = await updateCategory(updateInput);

    // Verify updated fields
    expect(result.color).toEqual('#00FF00');
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.id).toEqual(category.id);
    expect(result.updated_at.getTime() >= category.updated_at.getTime()).toBe(true);
  });

  it('should update both name and color', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    // Add small delay to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Category',
      color: '#00FF00'
    };

    const result = await updateCategory(updateInput);

    // Verify all updated fields
    expect(result.name).toEqual('Updated Category');
    expect(result.color).toEqual('#00FF00');
    expect(result.id).toEqual(category.id);
    expect(result.updated_at.getTime() >= category.updated_at.getTime()).toBe(true);
  });

  it('should set color to null', async () => {
    // Create test category with color
    const category = await createTestCategory({
      name: 'Test Category',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      color: null
    };

    const result = await updateCategory(updateInput);

    // Verify color is set to null
    expect(result.color).toBeNull();
    expect(result.name).toEqual('Test Category'); // Should remain unchanged
    expect(result.id).toEqual(category.id);
  });

  it('should handle category with null color', async () => {
    // Create test category without color
    const category = await createTestCategory({
      name: 'Test Category',
      color: null
    });

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Name',
      color: '#BLUE'
    };

    const result = await updateCategory(updateInput);

    // Verify updates
    expect(result.name).toEqual('Updated Name');
    expect(result.color).toEqual('#BLUE');
    expect(result.id).toEqual(category.id);
  });

  it('should save changes to database', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    // Add small delay to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Category',
      color: '#00FF00'
    };

    await updateCategory(updateInput);

    // Query database directly to verify changes
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category');
    expect(categories[0].color).toEqual('#00FF00');
    expect(categories[0].updated_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at.getTime() >= category.updated_at.getTime()).toBe(true);
  });

  it('should throw error for non-existent category', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    expect(updateCategory(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only provided fields', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Original Category',
      color: '#FF0000'
    });

    // Add small delay to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 1));

    // Update only name
    const updateInput: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Name Only'
    };

    const result = await updateCategory(updateInput);

    // Verify only name was updated, color remains unchanged
    expect(result.name).toEqual('Updated Name Only');
    expect(result.color).toEqual('#FF0000'); // Should remain unchanged
    expect(result.id).toEqual(category.id);
    expect(result.created_at.getTime()).toEqual(category.created_at.getTime());
    expect(result.updated_at.getTime() >= category.updated_at.getTime()).toBe(true);
  });

  it('should handle empty update gracefully', async () => {
    // Create test category
    const category = await createTestCategory({
      name: 'Test Category',
      color: '#FF0000'
    });

    // Add small delay to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 1));

    // Update with only ID (no other fields)
    const updateInput: UpdateCategoryInput = {
      id: category.id
    };

    const result = await updateCategory(updateInput);

    // Verify nothing changed except updated_at
    expect(result.name).toEqual('Test Category');
    expect(result.color).toEqual('#FF0000');
    expect(result.id).toEqual(category.id);
    expect(result.created_at.getTime()).toEqual(category.created_at.getTime());
    expect(result.updated_at.getTime() >= category.updated_at.getTime()).toBe(true);
  });
});
