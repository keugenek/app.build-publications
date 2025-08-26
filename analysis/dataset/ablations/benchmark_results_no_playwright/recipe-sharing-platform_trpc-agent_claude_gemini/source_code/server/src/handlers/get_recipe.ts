import { db } from '../db';
import { recipesTable, usersTable, ingredientsTable, recipeCategoriesTable } from '../db/schema';
import { type RecipeWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getRecipe = async (id: number): Promise<RecipeWithDetails> => {
  try {
    // Query recipe with author information
    const recipeResults = await db.select({
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      instructions: recipesTable.instructions,
      author_id: recipesTable.author_id,
      author_username: usersTable.username,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at,
    })
    .from(recipesTable)
    .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id))
    .where(eq(recipesTable.id, id))
    .execute();

    if (recipeResults.length === 0) {
      throw new Error(`Recipe with id ${id} not found`);
    }

    const recipe = recipeResults[0];

    // Query ingredients for this recipe
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipe_id, id))
      .execute();

    // Query categories for this recipe
    const categoryResults = await db.select({
      category: recipeCategoriesTable.category,
    })
    .from(recipeCategoriesTable)
    .where(eq(recipeCategoriesTable.recipe_id, id))
    .execute();

    const categories = categoryResults.map(result => result.category);

    // Return the complete recipe with details
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      author_id: recipe.author_id,
      author_username: recipe.author_username,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      ingredients: ingredients,
      categories: categories,
    };
  } catch (error) {
    console.error('Recipe retrieval failed:', error);
    throw error;
  }
};
