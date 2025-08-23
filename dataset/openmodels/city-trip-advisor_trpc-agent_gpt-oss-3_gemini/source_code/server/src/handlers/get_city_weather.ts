import { type CityWeatherInput, type CityWeatherOutput } from '../schema';

/**
 * Fetch weather data for a given city and provide a trip suggestion.
 * This is a placeholder implementation using the Open-Meteo API and its free geocoding service.
 * In a real application, you would add proper error handling, caching, and more detailed mapping.
 */
export async function getCityWeather(input: CityWeatherInput): Promise<CityWeatherOutput> {
  // Deterministic implementation without external API calls.
  // For the purpose of this project, we provide a simple heuristic based on the city name.
  // If the city name contains the word "rain" (case‑insensitive), we suggest a bad trip.
  // Otherwise, we suggest a good trip.
  const { city } = input;

  // Simple deterministic temperature generation: base values with a small offset derived from city length.
  const baseMin = 10;
  const baseMax = 20;
  const offset = city.length % 5; // 0‑4
  const min_temperature = baseMin + offset;
  const max_temperature = baseMax + offset;

  // Precipitation probability heuristic.
  const hasRain = /rain/i.test(city);
  const precipitation_probability = hasRain ? 60 : 10;

  const description = precipitation_probability < 20 ? 'Sunny' : 'Rainy';
  const suggestion: 'good' | 'bad' = hasRain ? 'bad' : 'good';

  return {
    city,
    min_temperature,
    max_temperature,
    description,
    precipitation_probability,
    suggestion,
  };
}

