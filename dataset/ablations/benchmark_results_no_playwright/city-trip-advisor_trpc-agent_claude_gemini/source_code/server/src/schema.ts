import { z } from 'zod';

// Weather forecast schema from OpenMeteo API
export const weatherForecastSchema = z.object({
  temperature_min: z.number(),
  temperature_max: z.number(),
  precipitation: z.number(), // mm of precipitation
  date: z.string(), // ISO date string
});

export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

// Trip suggestion input schema
export const tripSuggestionInputSchema = z.object({
  city: z.string().min(1, 'City name is required').trim(),
});

export type TripSuggestionInput = z.infer<typeof tripSuggestionInputSchema>;

// Trip suggestion response schema
export const tripSuggestionSchema = z.object({
  id: z.number(),
  city: z.string(),
  suggestion: z.enum(['Yes', 'No']),
  temperature_min: z.number(),
  temperature_max: z.number(),
  precipitation: z.number(),
  forecast_date: z.coerce.date(),
  reasoning: z.string(), // Explanation of why the suggestion was made
  created_at: z.coerce.date(),
});

export type TripSuggestion = z.infer<typeof tripSuggestionSchema>;

// Historical trip suggestions query schema
export const getTripSuggestionsInputSchema = z.object({
  city: z.string().optional(), // Filter by city if provided
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export type GetTripSuggestionsInput = z.infer<typeof getTripSuggestionsInputSchema>;
