import { db } from '../db';
import { customCategoriesTable } from '../db/schema';
import { type CreateCustomCategoryInput, type CustomCategory } from '../schema';

export const createCustomCategory = async (input: CreateCustomCategoryInput): Promise<CustomCategory> => {
  try {
    // Insert custom category record
    const result = await db.insert(customCategoriesTable)
      .values({
        name: input.name,
        userId: input.userId
      })
      .returning()
      .execute();

    // Return the created custom category
    return result[0];
  } catch (error) {
    console.error('Custom category creation failed:', error);
    throw error;
  }
};
