import { db } from '../db';
import { recipesTable, recipeCategoriesTable } from '../db/schema';
import { sql, and, inArray } from 'drizzle-orm';
import { type SearchRecipesInput, type Recipe } from '../schema';

export const searchRecipes = async (input: SearchRecipesInput): Promise<Recipe[]> => {
  try {
    // Start with a base query
    const baseQuery = db.select({
      id: recipesTable.id,
      title: recipesTable.title,
      description: recipesTable.description,
      ingredients: recipesTable.ingredients,
      instructions: recipesTable.instructions,
      imageUrl: recipesTable.imageUrl,
      createdAt: recipesTable.createdAt,
      updatedAt: recipesTable.updatedAt,
    })
    .from(recipesTable);
    
    // Apply filters
    const conditions = [];
    
    // Text search condition
    if (input.query) {
      conditions.push(
        sql`(${recipesTable.title} ILIKE ${'%' + input.query + '%'} OR ${recipesTable.description} ILIKE ${'%' + input.query + '%'} OR ${recipesTable.ingredients}::text ILIKE ${'%' + input.query + '%'})`
      );
    }
    
    // Category filter
    if (input.categoryIds && input.categoryIds.length > 0) {
      // Get recipe IDs that match the categories
      const recipeCategories = await db.select({
        recipeId: recipeCategoriesTable.recipeId,
      })
      .from(recipeCategoriesTable)
      .where(inArray(recipeCategoriesTable.categoryId, input.categoryIds));
      
      const matchingRecipeIds = [...new Set(recipeCategories.map(rc => rc.recipeId))];
      
      // If no recipes match the categories, return empty array
      if (matchingRecipeIds.length === 0) {
        return [];
      }
      
      // Add filter for matching recipe IDs
      conditions.push(inArray(recipesTable.id, matchingRecipeIds));
    }
    
    // Apply conditions to query if any exist
    let query;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    } else {
      query = baseQuery;
    }
    
    // Execute query
    const results = await query.execute();
    
    // Map to the expected Recipe type
    return results.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients || [], // Ensure ingredients is always an array
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
    }));
  } catch (error) {
    console.error('Search recipes failed:', error);
    throw error;
  }
};
