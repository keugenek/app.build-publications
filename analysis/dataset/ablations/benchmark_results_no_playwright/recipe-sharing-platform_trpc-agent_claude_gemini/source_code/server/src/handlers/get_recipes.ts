import { db } from '../db';
import { recipesTable, ingredientsTable, recipeCategoriesTable, usersTable } from '../db/schema';
import { type RecipeWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getRecipes = async (): Promise<RecipeWithDetails[]> => {
  try {
    // Get all recipes with author information
    const recipesWithAuthors = await db.select({
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      instructions: recipesTable.instructions,
      author_id: recipesTable.author_id,
      author_username: usersTable.username,
      created_at: recipesTable.created_at,
      updated_at: recipesTable.updated_at
    })
      .from(recipesTable)
      .innerJoin(usersTable, eq(recipesTable.author_id, usersTable.id))
      .execute();

    // Get all ingredients for all recipes
    const allIngredients = await db.select()
      .from(ingredientsTable)
      .execute();

    // Get all categories for all recipes
    const allCategories = await db.select()
      .from(recipeCategoriesTable)
      .execute();

    // Group ingredients and categories by recipe_id
    const ingredientsByRecipe = new Map();
    allIngredients.forEach(ingredient => {
      if (!ingredientsByRecipe.has(ingredient.recipe_id)) {
        ingredientsByRecipe.set(ingredient.recipe_id, []);
      }
      ingredientsByRecipe.get(ingredient.recipe_id).push(ingredient);
    });

    const categoriesByRecipe = new Map();
    allCategories.forEach(categoryJunction => {
      if (!categoriesByRecipe.has(categoryJunction.recipe_id)) {
        categoriesByRecipe.set(categoryJunction.recipe_id, []);
      }
      categoriesByRecipe.get(categoryJunction.recipe_id).push(categoryJunction.category);
    });

    // Combine all data into RecipeWithDetails format
    const recipesWithDetails: RecipeWithDetails[] = recipesWithAuthors.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      author_id: recipe.author_id,
      author_username: recipe.author_username,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      ingredients: ingredientsByRecipe.get(recipe.id) || [],
      categories: categoriesByRecipe.get(recipe.id) || []
    }));

    return recipesWithDetails;
  } catch (error) {
    console.error('Failed to get recipes:', error);
    throw error;
  }
};
