import { db } from '../db';
import { recipesTable, recipeCategoriesTable } from '../db/schema';
import { type UpdateRecipeInput, type Recipe } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const updateRecipe = async (input: UpdateRecipeInput): Promise<Recipe | null> => {
  try {
    // First verify the recipe exists
    const existingRecipe = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, input.id))
      .execute();

    if (existingRecipe.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.ingredients !== undefined) {
      updateData.ingredients = input.ingredients;
    }
    if (input.instructions !== undefined) {
      updateData.instructions = input.instructions;
    }
    if (input.prep_time_minutes !== undefined) {
      updateData.prep_time_minutes = input.prep_time_minutes;
    }
    if (input.cook_time_minutes !== undefined) {
      updateData.cook_time_minutes = input.cook_time_minutes;
    }
    if (input.servings !== undefined) {
      updateData.servings = input.servings;
    }

    // Update the recipe
    const updatedRecipe = await db.update(recipesTable)
      .set(updateData)
      .where(eq(recipesTable.id, input.id))
      .returning()
      .execute();

    if (updatedRecipe.length === 0) {
      return null;
    }

    // Update category relationships if category_ids is provided
    if (input.category_ids !== undefined) {
      // Delete existing category relationships
      await db.delete(recipeCategoriesTable)
        .where(eq(recipeCategoriesTable.recipe_id, input.id))
        .execute();

      // Insert new category relationships
      if (input.category_ids.length > 0) {
        const categoryInserts = input.category_ids.map(categoryId => ({
          recipe_id: input.id,
          category_id: categoryId
        }));

        await db.insert(recipeCategoriesTable)
          .values(categoryInserts)
          .execute();
      }
    }

    const recipe = updatedRecipe[0];
    return {
      ...recipe,
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[]
    };
  } catch (error) {
    console.error('Recipe update failed:', error);
    throw error;
  }
};
