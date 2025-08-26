import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateCategoryInput, type UpdateCategoryInput, type Category } from '../schema';

/**
 * Create a new category in the database.
 * Returns the created category with generated id and created_at timestamp.
 */
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    const result = await db
      .insert(categoriesTable)
      .values({ name: input.name })
      .returning()
      .execute();
    // The returning clause gives us the full row, including id and created_at
    return result[0];
  } catch (error) {
    console.error('Failed to create category:', error);
    throw error;
  }
};

/**
 * Retrieve all categories from the database.
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const categories = await db.select().from(categoriesTable).execute();
    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};

/**
 * Update an existing category. Only the name can be updated.
 * Returns the updated category record.
 */
export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    const updateData: Partial<{ name: string }> = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    const result = await db
      .update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    // If no rows were updated, throw an error for consistency
    if (result.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }
    return result[0];
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
};
