import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type TripSuggestionInput, type TripSuggestion } from '../schema';
import { getWeatherForecast } from './get_weather_forecast';

/**
 * Creates a trip suggestion based on weather forecast for a given city
 * This handler combines weather data fetching with business logic for trip recommendations
 */
export async function createTripSuggestion(input: TripSuggestionInput): Promise<TripSuggestion> {
    try {
        // 1. Fetch weather forecast for the given city
        const forecast = await getWeatherForecast(input.city);
        
        // 2. Apply business logic to determine if trip is a good idea
        const isGoodTemperature = forecast.temperature_min >= 10 && forecast.temperature_max <= 25;
        const isLowPrecipitation = forecast.precipitation < 2;
        const suggestion = (isGoodTemperature && isLowPrecipitation) ? 'Yes' : 'No';
        
        // 3. Generate reasoning text explaining the decision
        let reasoning = '';
        if (suggestion === 'Yes') {
            reasoning = `Good trip conditions: comfortable temperature (${forecast.temperature_min}°C - ${forecast.temperature_max}°C) and low precipitation (${forecast.precipitation}mm).`;
        } else {
            const reasons = [];
            if (!isGoodTemperature) {
                if (forecast.temperature_max < 10) {
                    reasons.push('too cold');
                } else if (forecast.temperature_min > 25) {
                    reasons.push('too hot');
                } else {
                    reasons.push('temperature range not ideal');
                }
            }
            if (!isLowPrecipitation) {
                reasons.push(`significant precipitation expected (${forecast.precipitation}mm)`);
            }
            reasoning = `Trip not recommended due to: ${reasons.join(', ')}.`;
        }
        
        // 4. Save the suggestion to database
        const result = await db.insert(tripSuggestionsTable)
            .values({
                city: input.city,
                suggestion: suggestion as 'Yes' | 'No',
                temperature_min: forecast.temperature_min.toString(), // Convert number to string for numeric column
                temperature_max: forecast.temperature_max.toString(), // Convert number to string for numeric column
                precipitation: forecast.precipitation.toString(), // Convert number to string for numeric column
                forecast_date: new Date(forecast.date),
                reasoning: reasoning
            })
            .returning()
            .execute();

        // 5. Return the complete trip suggestion with numeric conversions
        const tripSuggestion = result[0];
        return {
            ...tripSuggestion,
            temperature_min: parseFloat(tripSuggestion.temperature_min), // Convert string back to number
            temperature_max: parseFloat(tripSuggestion.temperature_max), // Convert string back to number
            precipitation: parseFloat(tripSuggestion.precipitation) // Convert string back to number
        };
    } catch (error) {
        console.error('Trip suggestion creation failed:', error);
        throw error;
    }
}
