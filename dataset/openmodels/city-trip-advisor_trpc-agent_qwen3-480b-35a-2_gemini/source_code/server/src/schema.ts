import { z } from 'zod';

// Schema for weather data from Open-Meteo API
export const weatherDataSchema = z.object({
  city: z.string(),
  maxTemperature: z.number(),
  precipitationProbability: z.number(),
  isGoodIdea: z.boolean(),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Input schema for trip suggestion requests
export const tripSuggestionInputSchema = z.object({
  city: z.string().min(1, "City name is required"),
});

export type TripSuggestionInput = z.infer<typeof tripSuggestionInputSchema>;
