import { db } from '../db';
import { recipesTable, usersTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { eq } from 'drizzle-orm';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Validate that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    // Insert recipe record
    const result = await db.insert(recipesTable)
      .values({
        title: input.title,
        description: input.description,
        ingredients: input.ingredients,
        instructions: input.instructions,
        prep_time_minutes: input.prep_time_minutes,
        cook_time_minutes: input.cook_time_minutes,
        servings: input.servings,
        category: input.category,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
