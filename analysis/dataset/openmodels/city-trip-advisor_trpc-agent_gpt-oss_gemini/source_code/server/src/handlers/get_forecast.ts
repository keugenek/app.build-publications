import type { GetForecastInput, Forecast } from '../schema';

/**
 * Deterministic pseudo‑random forecast generation based on city name.
 * This implementation avoids external network calls while still providing
 * varied and reproducible data for tests.
 */
export const getForecast = async (input: GetForecastInput): Promise<Forecast> => {
  // Simple hash of the city string (sum of character codes).
  const hash = input.city.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // Base temperature between 10 °C and 24 °C.
  const baseTemp = (hash % 15) + 10; // 10 .. 24
  const min_temperature = baseTemp;
  const max_temperature = baseTemp + 5; // Ensure max > min

  // Precipitation between 0 mm and 4.5 mm.
  const precipitation = (hash % 10) * 0.5;

  // Recommendation heuristic:
  // "Good Idea" if max temperature is 15‑25 °C inclusive and precipitation < 1 mm.
  const recommendation =
    max_temperature >= 15 && max_temperature <= 25 && precipitation < 1
      ? 'Good Idea'
      : 'Not a Good Idea';

  // Date for tomorrow.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const forecast: Forecast = {
    city: input.city,
    date: tomorrow,
    min_temperature,
    max_temperature,
    precipitation,
    description: 'Generated forecast',
    recommendation,
  };

  return forecast;
};
