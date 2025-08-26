import { z } from 'zod';

// Trip suggestion input schema
export const tripSuggestionInputSchema = z.object({
  city: z.string().min(1, 'City name is required').trim()
});

export type TripSuggestionInput = z.infer<typeof tripSuggestionInputSchema>;

// Weather data schema from Open-Meteo API
export const weatherDataSchema = z.object({
  temperature_max: z.number(),
  precipitation_sum: z.number(),
  weather_code: z.number()
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Trip suggestion response schema
export const tripSuggestionSchema = z.object({
  city: z.string(),
  is_good_idea: z.boolean(),
  reason: z.string(),
  weather_details: z.object({
    max_temperature: z.number(),
    precipitation: z.number(),
    weather_description: z.string()
  }),
  forecast_date: z.string()
});

export type TripSuggestion = z.infer<typeof tripSuggestionSchema>;

// Trip history schema for database storage
export const tripHistorySchema = z.object({
  id: z.number(),
  city: z.string(),
  is_good_idea: z.boolean(),
  max_temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  forecast_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type TripHistory = z.infer<typeof tripHistorySchema>;

// Input schema for creating trip history records
export const createTripHistoryInputSchema = z.object({
  city: z.string(),
  is_good_idea: z.boolean(),
  max_temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  forecast_date: z.string()
});

export type CreateTripHistoryInput = z.infer<typeof createTripHistoryInputSchema>;
