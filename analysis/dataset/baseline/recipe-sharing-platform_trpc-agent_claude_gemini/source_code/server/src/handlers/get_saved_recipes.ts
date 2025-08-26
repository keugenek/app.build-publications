import { db } from '../db';
import { savedRecipesTable, recipesTable } from '../db/schema';
import { type GetSavedRecipesInput, type Recipe } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getSavedRecipes(input: GetSavedRecipesInput): Promise<Recipe[]> {
  try {
    // Join saved_recipes with recipes to get full recipe details
    // Order by saved_at timestamp (most recently saved first)
    const results = await db.select({
      // Select all recipe fields
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      ingredients: recipesTable.ingredients,
      instructions: recipesTable.instructions,
      categories: recipesTable.categories,
      prep_time_minutes: recipesTable.prep_time_minutes,
      cook_time_minutes: recipesTable.cook_time_minutes,
      servings: recipesTable.servings,
      difficulty: recipesTable.difficulty,
      author_id: recipesTable.author_id,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at
    })
    .from(savedRecipesTable)
    .innerJoin(recipesTable, eq(savedRecipesTable.recipe_id, recipesTable.id))
    .where(eq(savedRecipesTable.user_id, input.user_id))
    .orderBy(desc(savedRecipesTable.saved_at))
    .execute();

    // Cast JSON fields to their proper types and return the recipes
    return results.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[],
      categories: recipe.categories as Recipe['categories']
    }));
  } catch (error) {
    console.error('Get saved recipes failed:', error);
    throw error;
  }
}
