import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserRecipes(userId: number): Promise<Recipe[]> {
  try {
    // Fetch all recipes created by the user, ordered by newest first
    const results = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.user_id, userId))
      .orderBy(desc(recipesTable.created_at))
      .execute();

    // Return recipes - no numeric conversions needed as all fields are already correct types
    return results;
  } catch (error) {
    console.error('Get user recipes failed:', error);
    throw error;
  }
}
