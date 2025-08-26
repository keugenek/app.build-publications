import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    // Build the update values object only with provided fields
    const updateValues: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateValues['name'] = input.name;
    }

    if (input.color !== undefined) {
      updateValues['color'] = input.color;
    }

    // Update the category record
    const result = await db.update(categoriesTable)
      .set(updateValues)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    // Check if category was found and updated
    if (result.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};
