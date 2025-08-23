import { db } from '../db';
import { suggestionsTable } from '../db/schema';
import { type Suggestion } from '../schema';
import { eq } from 'drizzle-orm';

export const getSuggestions = async (userId: string): Promise<Suggestion[]> => {
  try {
    // Query suggestions for the specific user
    const results = await db.select()
      .from(suggestionsTable)
      .where(eq(suggestionsTable.user_id, userId))
      .orderBy(suggestionsTable.created_at)
      .execute();

    // Convert database results to the expected schema type
    return results.map(suggestion => ({
      id: suggestion.id,
      user_id: suggestion.user_id,
      message: suggestion.message,
      suggestion_type: suggestion.suggestion_type as 'break' | 'rest' | 'social' | 'sleep',
      created_at: suggestion.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    throw error;
  }
};
