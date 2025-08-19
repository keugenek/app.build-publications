import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type SearchRecipesInput, type Recipe } from '../schema';
import { eq, and, or, ilike, lte, SQL, sql } from 'drizzle-orm';

export const searchRecipes = async (input: SearchRecipesInput): Promise<Recipe[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Full-text search on title, description, and ingredients
    if (input.query && input.query.trim()) {
      const searchTerm = `%${input.query.trim().toLowerCase()}%`;
      
      // Create search condition using SQL fragments
      conditions.push(
        sql`(${recipesTable.title} ILIKE ${searchTerm} OR ${recipesTable.description} ILIKE ${searchTerm})`
      );
    }

    // Filter by categories - check if any of the recipe's categories match input categories
    if (input.categories && input.categories.length > 0) {
      // Use JSON operators to search within the JSON array
      const categoryParts = input.categories.map(category => 
        `${recipesTable.categories.name}::text ILIKE '%"${category}"%'`
      ).join(' OR ');
      
      conditions.push(sql.raw(`(${categoryParts})`));
    }

    // Filter by difficulty
    if (input.difficulty) {
      conditions.push(eq(recipesTable.difficulty, input.difficulty));
    }

    // Filter by maximum prep time
    if (input.max_prep_time !== undefined) {
      conditions.push(sql`${recipesTable.prep_time_minutes} <= ${input.max_prep_time}`);
    }

    // Filter by maximum cook time
    if (input.max_cook_time !== undefined) {
      conditions.push(sql`${recipesTable.cook_time_minutes} <= ${input.max_cook_time}`);
    }

    // Filter by author
    if (input.author_id !== undefined) {
      conditions.push(eq(recipesTable.author_id, input.author_id));
    }

    // Build and execute query
    const baseQuery = db.select().from(recipesTable);
    
    const results = conditions.length > 0 
      ? await baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await baseQuery.execute();

    // Transform results to match Recipe schema
    return results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients as string[], // JSON array
      instructions: recipe.instructions as string[], // JSON array
      categories: recipe.categories as any[], // JSON array of categories
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard' | null,
      author_id: recipe.author_id,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at
    }));
  } catch (error) {
    console.error('Recipe search failed:', error);
    throw error;
  }
};
