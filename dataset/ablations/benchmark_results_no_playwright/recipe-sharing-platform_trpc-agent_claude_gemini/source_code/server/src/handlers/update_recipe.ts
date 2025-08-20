import { db } from '../db';
import { recipesTable, ingredientsTable, recipeCategoriesTable, usersTable } from '../db/schema';
import { type UpdateRecipeInput, type RecipeWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRecipe = async (input: UpdateRecipeInput): Promise<RecipeWithDetails> => {
  try {
    return await db.transaction(async (tx) => {
      // First, verify the recipe exists
      const existingRecipe = await tx.select()
        .from(recipesTable)
        .where(eq(recipesTable.id, input.id))
        .execute();

      if (existingRecipe.length === 0) {
        throw new Error('Recipe not found');
      }

      // Update the main recipe fields if provided
      const updateFields: any = {
        updated_at: new Date()
      };

      if (input.title !== undefined) {
        updateFields.title = input.title;
      }
      if (input.description !== undefined) {
        updateFields.description = input.description;
      }
      if (input.instructions !== undefined) {
        updateFields.instructions = input.instructions;
      }

      await tx.update(recipesTable)
        .set(updateFields)
        .where(eq(recipesTable.id, input.id))
        .execute();

      // Update ingredients if provided
      if (input.ingredients !== undefined) {
        // Delete existing ingredients
        await tx.delete(ingredientsTable)
          .where(eq(ingredientsTable.recipe_id, input.id))
          .execute();

        // Insert new ingredients
        if (input.ingredients.length > 0) {
          await tx.insert(ingredientsTable)
            .values(input.ingredients.map(ingredient => ({
              recipe_id: input.id,
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit
            })))
            .execute();
        }
      }

      // Update categories if provided
      if (input.categories !== undefined) {
        // Delete existing category associations
        await tx.delete(recipeCategoriesTable)
          .where(eq(recipeCategoriesTable.recipe_id, input.id))
          .execute();

        // Insert new category associations
        if (input.categories.length > 0) {
          await tx.insert(recipeCategoriesTable)
            .values(input.categories.map(category => ({
              recipe_id: input.id,
              category: category
            })))
            .execute();
        }
      }

      // Fetch and return the updated recipe with all related data
      const updatedRecipeResult = await tx.select()
        .from(recipesTable)
        .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id))
        .where(eq(recipesTable.id, input.id))
        .execute();

      const updatedRecipe = updatedRecipeResult[0];
      const recipe = updatedRecipe.recipes;
      const author = updatedRecipe.users;

      // Fetch ingredients
      const ingredients = await tx.select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.recipe_id, input.id))
        .execute();

      // Fetch categories
      const categoryResults = await tx.select()
        .from(recipeCategoriesTable)
        .where(eq(recipeCategoriesTable.recipe_id, input.id))
        .execute();

      const categories = categoryResults.map(cat => cat.category);

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        author_id: recipe.author_id,
        author_username: author.username,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        ingredients: ingredients,
        categories: categories
      };
    });
  } catch (error) {
    console.error('Recipe update failed:', error);
    throw error;
  }
};
