import { z } from 'zod';

// Input schema for requesting a weather forecast for a specific city
export const getForecastInputSchema = z.object({
  city: z.string().min(1, { message: 'City name is required' })
});
export type GetForecastInput = z.infer<typeof getForecastInputSchema>;

// Output schema representing the weather forecast for tomorrow
export const forecastSchema = z.object({
  city: z.string(),
  date: z.coerce.date(), // Date for tomorrow
  min_temperature: z.number(), // °C
  max_temperature: z.number(), // °C
  precipitation: z.number(), // mm, total expected precipitation
  description: z.string(), // e.g., "Sunny", "Cloudy"
  recommendation: z.enum(['Good Idea', 'Not a Good Idea'])
});

export type Forecast = z.infer<typeof forecastSchema>;
