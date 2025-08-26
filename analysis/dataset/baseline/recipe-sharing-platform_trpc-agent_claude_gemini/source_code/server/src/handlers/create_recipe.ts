import { db } from '../db';
import { recipesTable, usersTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { eq } from 'drizzle-orm';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Validate that the author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error(`Author with id ${input.author_id} does not exist`);
    }

    // Insert recipe record
    const result = await db.insert(recipesTable)
      .values({
        title: input.title,
        description: input.description || null,
        ingredients: input.ingredients,
        instructions: input.instructions,
        categories: input.categories,
        prep_time_minutes: input.prep_time_minutes || null,
        cook_time_minutes: input.cook_time_minutes || null,
        servings: input.servings || null,
        difficulty: input.difficulty || null,
        author_id: input.author_id
      })
      .returning()
      .execute();

    const recipe = result[0];
    return {
      ...recipe,
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[],
      categories: recipe.categories as any[]
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
