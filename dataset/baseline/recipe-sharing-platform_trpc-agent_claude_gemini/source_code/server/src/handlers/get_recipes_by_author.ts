import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe, type RecipeCategory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getRecipesByAuthor(authorId: number): Promise<Recipe[]> {
  try {
    const results = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.author_id, authorId))
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // Return recipes with proper type handling
    return results.map(recipe => ({
      ...recipe,
      // JSON fields are already parsed by Drizzle
      ingredients: recipe.ingredients as string[],
      instructions: recipe.instructions as string[],
      categories: recipe.categories as RecipeCategory[]
    }));
  } catch (error) {
    console.error('Failed to fetch recipes by author:', error);
    throw error;
  }
}
