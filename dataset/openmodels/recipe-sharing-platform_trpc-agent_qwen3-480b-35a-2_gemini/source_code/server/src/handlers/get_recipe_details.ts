import { db } from '../db';
import { recipesTable, recipeIngredientsTable, recipeCategoriesTable } from '../db/schema';
import { type Recipe, type RecipeIngredient, type RecipeCategory } from '../schema';
import { eq } from 'drizzle-orm';

export type RecipeDetails = Recipe & {
  ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
};

export const getRecipeDetails = async (id: number): Promise<RecipeDetails | null> => {
  try {
    // First, get the main recipe
    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, id))
      .execute();

    if (recipes.length === 0) {
      return null;
    }

    const recipe = recipes[0];

    // Get ingredients for this recipe
    const ingredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, id))
      .execute();

    // Get categories for this recipe
    const categories = await db.select()
      .from(recipeCategoriesTable)
      .where(eq(recipeCategoriesTable.recipe_id, id))
      .execute();

    // Return the combined recipe details
    return {
      ...recipe,
      ingredients,
      categories
    };
  } catch (error) {
    console.error('Failed to fetch recipe details:', error);
    throw error;
  }
};
