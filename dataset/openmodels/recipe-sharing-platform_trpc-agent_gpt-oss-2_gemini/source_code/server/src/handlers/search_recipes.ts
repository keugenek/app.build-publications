import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type SearchRecipesInput, type Recipe } from '../schema';
import { and, ilike, sql, type SQL } from 'drizzle-orm';

/**
 * Search recipes based on optional criteria.
 * Supports free‑text search across the title (case‑insensitive) and exact matches for
 * title, ingredient, and category. All provided filters are combined with logical AND.
 */
export const searchRecipes = async (input: SearchRecipesInput): Promise<Recipe[]> => {
  // Base query selecting from the recipes table
  let query: any = db.select().from(recipesTable);
  // conditions array typed as SQL for proper type inference
  const conditions: SQL<unknown>[] = [];

  // Free‑text query – currently applied to the title field using ILIKE for case‑insensitivity
  if (input.query) {
    const pattern = `%${input.query}%`;
    conditions.push(ilike(recipesTable.title, pattern));
  }

  // Specific title filter – also uses ILIKE to allow partial matches
  if (input.title) {
    const pattern = `%${input.title}%`;
    conditions.push(ilike(recipesTable.title, pattern));
  }

  // Ingredient filter – checks if the JSONB array contains the provided ingredient
  if (input.ingredient) {
    // PostgreSQL JSONB containment operator @>
    // We stringify a one‑element array because ingredients is stored as an array of strings
    conditions.push(sql`${recipesTable.ingredients} @> ${JSON.stringify([input.ingredient])}`);
  }

  // Category filter – similar JSONB containment check
  if (input.category) {
    conditions.push(sql`${recipesTable.categories} @> ${JSON.stringify([input.category])}`);
  }

  // Apply WHERE clause if any conditions were added
  if (conditions.length > 0) {
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
    query = query.where(whereClause);
  }

  // Execute the query and return the raw rows (they already match the Recipe schema)
  const rows = await query.execute() as any[];
  // Cast JSONB columns to string[] as defined in the Recipe schema
  const results = rows.map((row: any) => ({
    ...row,
    ingredients: row.ingredients as unknown as string[],
    categories: row.categories as unknown as string[]
  }));
  return results;
};
