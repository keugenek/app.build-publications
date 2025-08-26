import { db } from '../db';
import { recipesTable, ingredientsTable, recipeCategoriesTable, usersTable } from '../db/schema';
import { type CreateRecipeInput, type RecipeWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export async function createRecipe(input: CreateRecipeInput): Promise<RecipeWithDetails> {
  try {
    // Verify that the author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error(`Author with ID ${input.author_id} does not exist`);
    }

    // Use a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Create the main recipe record
      const recipeResult = await tx.insert(recipesTable)
        .values({
          title: input.title,
          description: input.description,
          instructions: input.instructions,
          author_id: input.author_id
        })
        .returning()
        .execute();

      const recipe = recipeResult[0];

      // 2. Create associated ingredient records
      const ingredientPromises = input.ingredients.map(ingredient =>
        tx.insert(ingredientsTable)
          .values({
            recipe_id: recipe.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          })
          .returning()
          .execute()
      );

      const ingredientResults = await Promise.all(ingredientPromises);
      const ingredients = ingredientResults.map(result => result[0]);

      // 3. Create category associations
      const categoryPromises = input.categories.map(category =>
        tx.insert(recipeCategoriesTable)
          .values({
            recipe_id: recipe.id,
            category: category
          })
          .execute()
      );

      await Promise.all(categoryPromises);

      // Return the complete recipe data for the transaction
      return {
        recipe,
        ingredients,
        categories: input.categories,
        author_username: author[0].username
      };
    });

    // 4. Return the complete recipe with all related data
    return {
      id: result.recipe.id,
      title: result.recipe.title,
      description: result.recipe.description,
      instructions: result.recipe.instructions,
      author_id: result.recipe.author_id,
      author_username: result.author_username,
      created_at: result.recipe.created_at,
      updated_at: result.recipe.updated_at,
      ingredients: result.ingredients,
      categories: result.categories
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
}
