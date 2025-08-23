import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Test inputs
const testCategoryInput = {
  name: 'Test Category'
};

const testUpdateInput: UpdateCategoryInput = {
  id: 1,
  name: 'Updated Category Name'
};

describe('updateCategory', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test category to update
    await db.insert(categoriesTable).values(testCategoryInput).execute();
  });
  
  afterEach(resetDB);

  it('should update a category name', async () => {
    const result = await updateCategory(testUpdateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated category to database', async () => {
    const result = await updateCategory(testUpdateInput);

    // Query the database to verify the update was saved
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category Name');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when category is not found', async () => {
    const invalidInput: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(invalidInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create another category first
    const newCategory = await db.insert(categoriesTable)
      .values({ name: 'Another Category' })
      .returning()
      .execute();
    
    const partialUpdateInput: UpdateCategoryInput = {
      id: newCategory[0].id,
      name: 'Partially Updated Name'
      // Note: not providing other optional fields
    };

    const result = await updateCategory(partialUpdateInput);

    expect(result.id).toEqual(newCategory[0].id);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
