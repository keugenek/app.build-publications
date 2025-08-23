import { z } from 'zod';

// Input schema for requesting a weather suggestion for a city
export const cityWeatherInputSchema = z.object({
  city: z.string().min(1, { message: 'City name is required' })
});

export type CityWeatherInput = z.infer<typeof cityWeatherInputSchema>;

// Output schema representing the weather data and trip suggestion
export const cityWeatherOutputSchema = z.object({
  city: z.string(),
  min_temperature: z.number(), // °C
  max_temperature: z.number(), // °C
  description: z.string(), // e.g., "Sunny", "Cloudy"
  precipitation_probability: z.number(), // percentage 0-100
  suggestion: z.enum(['good', 'bad']) // "good" if trip is a good idea, else "bad"
});

export type CityWeatherOutput = z.infer<typeof cityWeatherOutputSchema>;
