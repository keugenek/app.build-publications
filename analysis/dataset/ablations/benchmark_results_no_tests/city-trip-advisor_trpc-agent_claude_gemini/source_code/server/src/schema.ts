import { z } from 'zod';

// Weather data schema from Open-Meteo API
export const weatherDataSchema = z.object({
  temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  date: z.string(), // ISO date string
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Trip suggestion schema
export const tripSuggestionSchema = z.object({
  city: z.string(),
  is_good_idea: z.boolean(),
  temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  date: z.string(), // ISO date string
  reason: z.string(), // Explanation for the suggestion
});

export type TripSuggestion = z.infer<typeof tripSuggestionSchema>;

// Input schema for getting trip suggestion
export const getTripSuggestionInputSchema = z.object({
  city: z.string().min(1, "City name is required").max(100, "City name too long"),
});

export type GetTripSuggestionInput = z.infer<typeof getTripSuggestionInputSchema>;

// Weather cache entry schema for database storage
export const weatherCacheSchema = z.object({
  id: z.number(),
  city: z.string(),
  temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  date: z.string(),
  created_at: z.coerce.date(),
});

export type WeatherCache = z.infer<typeof weatherCacheSchema>;

// Input schema for creating weather cache entry
export const createWeatherCacheInputSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  precipitation: z.number(),
  weather_description: z.string(),
  date: z.string(),
});

export type CreateWeatherCacheInput = z.infer<typeof createWeatherCacheInputSchema>;
