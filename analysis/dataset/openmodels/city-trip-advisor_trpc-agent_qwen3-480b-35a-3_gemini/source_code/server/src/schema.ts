import { z } from 'zod';

// Weather forecast schema
export const weatherForecastSchema = z.object({
  city: z.string(),
  maxTemperature: z.number(),
  precipitationProbability: z.number(),
  isGoodIdea: z.boolean(),
  forecastDate: z.string(), // YYYY-MM-DD format
});

export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

// Input schema for city name
export const cityInputSchema = z.object({
  cityName: z.string().min(1, "City name is required"),
});

export type CityInput = z.infer<typeof cityInputSchema>;
