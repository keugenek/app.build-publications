import { z } from 'zod';

// Weather forecast schema from Open-Meteo API
export const weatherForecastSchema = z.object({
  temperature: z.number(),
  precipitation: z.number(), // mm of rain/snow
  weather_description: z.string()
});

export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

// Trip suggestion input schema
export const tripSuggestionInputSchema = z.object({
  city: z.string().min(1, 'City name is required')
});

export type TripSuggestionInput = z.infer<typeof tripSuggestionInputSchema>;

// Trip suggestion response schema
export const tripSuggestionResponseSchema = z.object({
  isGoodIdea: z.boolean(),
  message: z.string(),
  city: z.string(),
  weather: weatherForecastSchema
});

export type TripSuggestionResponse = z.infer<typeof tripSuggestionResponseSchema>;
