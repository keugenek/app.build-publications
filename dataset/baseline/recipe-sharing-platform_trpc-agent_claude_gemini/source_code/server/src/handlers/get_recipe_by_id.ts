import { db } from '../db';
import { recipesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetRecipeByIdInput, type Recipe, type RecipeCategory } from '../schema';

export const getRecipeById = async (input: GetRecipeByIdInput): Promise<Recipe | null> => {
  try {
    const results = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const recipe = results[0];
    
    // Return the recipe with proper type conversion
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients as string[], // JSON field
      instructions: recipe.instructions as string[], // JSON field
      categories: recipe.categories as RecipeCategory[], // JSON field  
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      author_id: recipe.author_id,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at
    };
  } catch (error) {
    console.error('Get recipe by ID failed:', error);
    throw error;
  }
};
