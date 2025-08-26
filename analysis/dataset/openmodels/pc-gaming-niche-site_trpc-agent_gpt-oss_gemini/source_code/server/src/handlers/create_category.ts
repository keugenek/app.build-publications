import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

/**
 * Creates a new category in the database and returns the created record.
 * Handles any database errors by logging and rethrowing.
 */
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    const result = await db
      .insert(categoriesTable)
      .values({
        name: input.name,
      })
      .returning()
      .execute();

    const category = result[0];
    // Drizzle returns Date for timestamp columns; ensure correct type
    return {
      ...category,
      created_at: new Date(category.created_at),
    } as Category;
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};
