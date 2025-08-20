import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test category
  const createTestCategory = async (name = 'Electronics', description = 'Electronic devices') => {
    const result = await db.insert(categoriesTable)
      .values({ name, description })
      .returning()
      .execute();
    return result[0];
  };

  it('should update category name only', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Electronics'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Updated Electronics');
    expect(result.description).toEqual('Electronic devices'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update description only', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      description: 'Updated description'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Electronics'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Home & Garden',
      description: 'Items for home and garden'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Home & Garden');
    expect(result.description).toEqual('Items for home and garden');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      description: null
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Electronics'); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return existing category when no fields to update', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Electronics');
    expect(result.description).toEqual('Electronic devices');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated category to database', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Books & Media',
      description: 'Books, movies, and other media'
    };

    await updateCategory(input);

    // Verify changes were persisted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Books & Media');
    expect(categories[0].description).toEqual('Books, movies, and other media');
  });

  it('should throw error when category does not exist', async () => {
    const input: UpdateCategoryInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Category'
    };

    await expect(updateCategory(input))
      .rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should throw error when trying to update to duplicate name', async () => {
    // Create two categories
    await createTestCategory('Electronics', 'Electronic devices');
    const category2 = await createTestCategory('Books', 'Book collection');

    const input: UpdateCategoryInput = {
      id: category2.id,
      name: 'Electronics' // Try to use existing name
    };

    await expect(updateCategory(input))
      .rejects.toThrow(/unique/i);
  });

  it('should handle partial updates correctly with mixed data types', async () => {
    // Test with a category that has null description initially
    const result = await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: null })
      .returning()
      .execute();
    const category = result[0];

    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Test Category'
      // description not provided - should remain null
    };

    const updated = await updateCategory(input);

    expect(updated.id).toEqual(category.id);
    expect(updated.name).toEqual('Updated Test Category');
    expect(updated.description).toBeNull(); // Should remain null
  });

  it('should handle empty string description update', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      description: '' // Empty string
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Electronics'); // Should remain unchanged
    expect(result.description).toEqual(''); // Should be empty string, not null
  });
});
