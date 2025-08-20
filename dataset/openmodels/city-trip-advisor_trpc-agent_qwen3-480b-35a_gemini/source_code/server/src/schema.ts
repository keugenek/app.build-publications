import { z } from 'zod';

// Weather forecast schema
export const weatherForecastSchema = z.object({
  city: z.string(),
  date: z.string(), // YYYY-MM-DD format
  temperature: z.number(),
  precipitation_probability: z.number(),
  is_good_idea: z.boolean(),
});

export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

// Input schema for getting weather forecast
export const getWeatherInputSchema = z.object({
  city: z.string().min(1, "City name is required"),
});

export type GetWeatherInput = z.infer<typeof getWeatherInputSchema>;
