// This file exists for consistency but we're not persisting weather data
// Weather data is fetched live from Open-Meteo API

import { z } from 'zod';
import { weatherForecastSchema } from '../schema';

// Export the type for consistency
export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

// For relation queries, we export an empty tables object
export const tables = {};
