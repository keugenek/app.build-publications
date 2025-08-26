import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { type CreateTripHistoryInput, type TripHistory } from '../schema';

export const saveTripHistory = async (input: CreateTripHistoryInput): Promise<TripHistory> => {
  try {
    // Insert trip history record
    const result = await db.insert(tripHistoryTable)
      .values({
        city: input.city,
        is_good_idea: input.is_good_idea,
        max_temperature: input.max_temperature, // real columns don't need conversion
        precipitation: input.precipitation, // real columns don't need conversion
        weather_description: input.weather_description,
        forecast_date: new Date(input.forecast_date) // Convert string to Date
      })
      .returning()
      .execute();

    // Return the saved record
    const savedRecord = result[0];
    return {
      id: savedRecord.id,
      city: savedRecord.city,
      is_good_idea: savedRecord.is_good_idea,
      max_temperature: savedRecord.max_temperature,
      precipitation: savedRecord.precipitation,
      weather_description: savedRecord.weather_description,
      forecast_date: savedRecord.forecast_date,
      created_at: savedRecord.created_at
    };
  } catch (error) {
    console.error('Trip history save failed:', error);
    throw error;
  }
};
