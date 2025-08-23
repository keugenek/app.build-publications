import { db } from '../db';
import { recipesTable, recipeIngredientsTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';

export const createRecipe = async (input: CreateRecipeInput, userId: number): Promise<Recipe> => {
  try {
    // Insert recipe record
    const recipeResult = await db.insert(recipesTable)
      .values({
        user_id: userId,
        name: input.name,
        instructions: input.instructions,
        preparation_time: input.preparation_time,
        cooking_time: input.cooking_time,
        serving_size: input.serving_size
      })
      .returning()
      .execute();

    const recipe = recipeResult[0];

    // Insert ingredients
    if (input.ingredients && input.ingredients.length > 0) {
      const ingredientsValues = input.ingredients.map(ingredient => ({
        recipe_id: recipe.id,
        ingredient: ingredient
      }));

      await db.insert(recipeIngredientsTable)
        .values(ingredientsValues)
        .execute();
    }

    // Insert categories
    if (input.categories && input.categories.length > 0) {
      const categoriesValues = input.categories.map(category => ({
        recipe_id: recipe.id,
        category: category
      }));

      await db.insert(recipeCategoriesTable)
        .values(categoriesValues)
        .execute();
    }

    // Return the recipe in the expected format
    return {
      id: recipe.id,
      user_id: recipe.user_id,
      name: recipe.name,
      instructions: recipe.instructions,
      preparation_time: recipe.preparation_time,
      cooking_time: recipe.cooking_time,
      serving_size: recipe.serving_size,
      created_at: recipe.created_at
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
