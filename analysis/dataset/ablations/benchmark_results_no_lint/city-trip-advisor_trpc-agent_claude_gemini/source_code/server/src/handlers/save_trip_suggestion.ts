import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type TripSuggestionResponse } from '../schema';

export const saveTripSuggestion = async (suggestion: TripSuggestionResponse): Promise<void> => {
  try {
    // Insert trip suggestion record into database
    await db.insert(tripSuggestionsTable)
      .values({
        city: suggestion.city,
        temperature: suggestion.weather.temperature.toString(), // Convert number to string for numeric column
        precipitation: suggestion.weather.precipitation.toString(), // Convert number to string for numeric column
        is_good_idea: suggestion.isGoodIdea,
        message: suggestion.message
      })
      .execute();
  } catch (error) {
    console.error('Failed to save trip suggestion:', error);
    throw error;
  }
};
