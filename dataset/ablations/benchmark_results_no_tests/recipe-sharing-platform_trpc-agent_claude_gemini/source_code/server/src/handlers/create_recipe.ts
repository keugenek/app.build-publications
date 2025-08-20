import { db } from '../db';
import { recipesTable, recipeCategoriesTable, usersTable, categoriesTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createRecipe = async (input: CreateRecipeInput): Promise<Recipe> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // If category_ids are provided, verify they exist
    if (input.category_ids && input.category_ids.length > 0) {
      const categories = await db.select()
        .from(categoriesTable)
        .where(inArray(categoriesTable.id, input.category_ids))
        .execute();

      if (categories.length !== input.category_ids.length) {
        const foundCategoryIds = categories.map(c => c.id);
        const missingIds = input.category_ids.filter(id => !foundCategoryIds.includes(id));
        throw new Error(`Categories with ids ${missingIds.join(', ')} not found`);
      }
    }

    // Insert recipe record
    const result = await db.insert(recipesTable)
      .values({
        title: input.title,
        description: input.description,
        ingredients: input.ingredients,
        instructions: input.instructions,
        prep_time_minutes: input.prep_time_minutes,
        cook_time_minutes: input.cook_time_minutes,
        servings: input.servings,
        user_id: input.user_id
      })
      .returning()
      .execute();

    const recipe = result[0];

    // If category_ids are provided, create recipe-category relationships
    if (input.category_ids && input.category_ids.length > 0) {
      const recipeCategoryValues = input.category_ids.map(categoryId => ({
        recipe_id: recipe.id,
        category_id: categoryId
      }));

      await db.insert(recipeCategoriesTable)
        .values(recipeCategoryValues)
        .execute();
    }

    // Return recipe with properly typed JSON fields
    return {
      ...recipe,
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[]
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
};
