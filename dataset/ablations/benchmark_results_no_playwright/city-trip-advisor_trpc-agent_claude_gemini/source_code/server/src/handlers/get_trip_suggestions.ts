import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type GetTripSuggestionsInput, type TripSuggestion } from '../schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Retrieves historical trip suggestions with optional city filtering
 * This handler is responsible for querying the database for past suggestions
 */
export async function getTripSuggestions(input: GetTripSuggestionsInput): Promise<TripSuggestion[]> {
  try {
    // Build query based on whether city filter is provided
    const results = input.city 
      ? await db.select()
          .from(tripSuggestionsTable)
          .where(eq(tripSuggestionsTable.city, input.city))
          .orderBy(desc(tripSuggestionsTable.created_at))
          .limit(input.limit)
          .execute()
      : await db.select()
          .from(tripSuggestionsTable)
          .orderBy(desc(tripSuggestionsTable.created_at))
          .limit(input.limit)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(suggestion => ({
      ...suggestion,
      temperature_min: parseFloat(suggestion.temperature_min),
      temperature_max: parseFloat(suggestion.temperature_max),
      precipitation: parseFloat(suggestion.precipitation)
    }));
  } catch (error) {
    console.error('Trip suggestions retrieval failed:', error);
    throw error;
  }
}
