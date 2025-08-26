import { db } from '../db';
import { recipesTable, recipeCategoriesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Insert the recipe
      const [recipeResult] = await tx.insert(recipesTable)
        .values({
          title: input.title,
          description: input.description,
          ingredients: input.ingredients,
          instructions: input.instructions,
          imageUrl: input.imageUrl
        })
        .returning()
        .execute();

      // Insert recipe-category associations
      if (input.categoryIds && input.categoryIds.length > 0) {
        const categoryAssociations = input.categoryIds.map(categoryId => ({
          recipeId: recipeResult.id,
          categoryId
        }));

        await tx.insert(recipeCategoriesTable)
          .values(categoryAssociations)
          .execute();
      }

      // Return the recipe with proper types
      return {
        id: recipeResult.id,
        title: recipeResult.title,
        description: recipeResult.description,
        ingredients: recipeResult.ingredients,
        instructions: recipeResult.instructions,
        imageUrl: recipeResult.imageUrl || null,
        createdAt: recipeResult.createdAt,
        updatedAt: recipeResult.updatedAt
      };
    });
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
