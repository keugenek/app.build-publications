import { db } from '../db';
import { recipesTable, ingredientsTable, recipeCategoriesTable, usersTable } from '../db/schema';
import { type RecipeWithDetails } from '../schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function getUserRecipes(userId: number): Promise<RecipeWithDetails[]> {
  try {
    // Fetch all recipes by the user with author information, ordered by created_at descending
    const recipesWithAuthor = await db.select()
      .from(recipesTable)
      .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id))
      .where(eq(recipesTable.author_id, userId))
      .orderBy(desc(recipesTable.created_at))
      .execute();

    if (recipesWithAuthor.length === 0) {
      return [];
    }

    // Extract recipe IDs for batch queries
    const recipeIds = recipesWithAuthor.map(result => result.recipes.id);

    // Fetch all ingredients for these recipes
    let allIngredients: any[] = [];
    if (recipeIds.length > 0) {
      allIngredients = await db.select()
        .from(ingredientsTable)
        .where(inArray(ingredientsTable.recipe_id, recipeIds))
        .execute();
    }

    // Fetch all categories for these recipes
    let allCategories: any[] = [];
    if (recipeIds.length > 0) {
      allCategories = await db.select()
        .from(recipeCategoriesTable)
        .where(inArray(recipeCategoriesTable.recipe_id, recipeIds))
        .execute();
    }

    // Group ingredients and categories by recipe_id
    const ingredientsByRecipe = new Map<number, typeof allIngredients>();
    const categoriesByRecipe = new Map<number, typeof allCategories>();

    allIngredients.forEach(ingredient => {
      if (!ingredientsByRecipe.has(ingredient.recipe_id)) {
        ingredientsByRecipe.set(ingredient.recipe_id, []);
      }
      ingredientsByRecipe.get(ingredient.recipe_id)!.push(ingredient);
    });

    allCategories.forEach(category => {
      if (!categoriesByRecipe.has(category.recipe_id)) {
        categoriesByRecipe.set(category.recipe_id, []);
      }
      categoriesByRecipe.get(category.recipe_id)!.push(category);
    });

    // Combine all data into RecipeWithDetails format
    const result: RecipeWithDetails[] = recipesWithAuthor.map(result => {
      const recipe = result.recipes;
      const author = result.users;
      
      const recipeIngredients = ingredientsByRecipe.get(recipe.id) || [];
      const recipeCategories = categoriesByRecipe.get(recipe.id) || [];

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        author_id: recipe.author_id,
        author_username: author.username,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        ingredients: recipeIngredients,
        categories: recipeCategories.map(cat => cat.category)
      };
    });

    return result;
  } catch (error) {
    console.error('Failed to get user recipes:', error);
    throw error;
  }
}
