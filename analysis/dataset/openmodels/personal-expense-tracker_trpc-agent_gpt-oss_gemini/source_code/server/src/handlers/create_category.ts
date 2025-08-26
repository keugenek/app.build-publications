import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

// Create a new category
export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    const result = await db
      .insert(categoriesTable)
      .values({
        name: input.name,
      })
      .returning()
      .execute();
    // result is an array with one element
    const category = result[0];
    return {
      ...category,
      // created_at is already a Date object from drizzle
    } as Category;
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};

// Fetch all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const categories = await db.select().from(categoriesTable).execute();
    // No numeric conversion needed, just return
    return categories as Category[];
  } catch (error) {
    console.error('Fetching categories failed:', error);
    throw error;
  }
};
