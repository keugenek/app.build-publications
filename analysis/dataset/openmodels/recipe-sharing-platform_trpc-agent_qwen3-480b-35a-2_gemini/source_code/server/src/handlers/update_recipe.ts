import { db } from '../db';
import { recipesTable, recipeIngredientsTable, recipeCategoriesTable } from '../db/schema';
import { type UpdateRecipeInput, type Recipe } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRecipe = async (input: UpdateRecipeInput): Promise<Recipe> => {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // First, check if the recipe exists
      const existingRecipe = await tx.select()
        .from(recipesTable)
        .where(eq(recipesTable.id, input.id))
        .limit(1)
        .execute();

      if (existingRecipe.length === 0) {
        throw new Error(`Recipe with id ${input.id} not found`);
      }

      const currentRecipe = existingRecipe[0];

      // Handle ingredients update if provided
      if (input.ingredients !== undefined) {
        // Delete existing ingredients
        await tx.delete(recipeIngredientsTable)
          .where(eq(recipeIngredientsTable.recipe_id, input.id))
          .execute();

        // Insert new ingredients
        if (input.ingredients.length > 0) {
          await tx.insert(recipeIngredientsTable)
            .values(input.ingredients.map(ingredient => ({
              recipe_id: input.id,
              ingredient
            })))
            .execute();
        }
      }

      // Handle categories update if provided
      if (input.categories !== undefined) {
        // Delete existing categories
        await tx.delete(recipeCategoriesTable)
          .where(eq(recipeCategoriesTable.recipe_id, input.id))
          .execute();

        // Insert new categories
        if (input.categories.length > 0) {
          await tx.insert(recipeCategoriesTable)
            .values(input.categories.map(category => ({
              recipe_id: input.id,
              category
            })))
            .execute();
        }
      }

      // Prepare update data - only include fields that are actually provided
      const updateData: any = {};
      let hasUpdates = false;

      if (input.name !== undefined) {
        updateData.name = input.name;
        hasUpdates = true;
      }
      if (input.instructions !== undefined) {
        updateData.instructions = input.instructions;
        hasUpdates = true;
      }
      if (input.preparation_time !== undefined) {
        updateData.preparation_time = input.preparation_time;
        hasUpdates = true;
      }
      if (input.cooking_time !== undefined) {
        updateData.cooking_time = input.cooking_time;
        hasUpdates = true;
      }
      if (input.serving_size !== undefined) {
        updateData.serving_size = input.serving_size;
        hasUpdates = true;
      }

      // Only perform update if there are fields to update
      if (hasUpdates) {
        const updatedRecipes = await tx.update(recipesTable)
          .set(updateData)
          .where(eq(recipesTable.id, input.id))
          .returning()
          .execute();

        if (updatedRecipes.length === 0) {
          throw new Error(`Failed to update recipe with id ${input.id}`);
        }

        currentRecipe.name = updatedRecipes[0].name || currentRecipe.name;
        currentRecipe.instructions = updatedRecipes[0].instructions || currentRecipe.instructions;
        currentRecipe.preparation_time = updatedRecipes[0].preparation_time !== undefined 
          ? updatedRecipes[0].preparation_time 
          : currentRecipe.preparation_time;
        currentRecipe.cooking_time = updatedRecipes[0].cooking_time !== undefined 
          ? updatedRecipes[0].cooking_time 
          : currentRecipe.cooking_time;
        currentRecipe.serving_size = updatedRecipes[0].serving_size !== undefined 
          ? updatedRecipes[0].serving_size 
          : currentRecipe.serving_size;
      }

      // Return the updated recipe in the expected format
      return {
        id: currentRecipe.id,
        user_id: currentRecipe.user_id,
        name: currentRecipe.name,
        instructions: currentRecipe.instructions,
        preparation_time: currentRecipe.preparation_time,
        cooking_time: currentRecipe.cooking_time,
        serving_size: currentRecipe.serving_size,
        created_at: currentRecipe.created_at
      };
    });
  } catch (error) {
    console.error('Recipe update failed:', error);
    throw error;
  }
};
