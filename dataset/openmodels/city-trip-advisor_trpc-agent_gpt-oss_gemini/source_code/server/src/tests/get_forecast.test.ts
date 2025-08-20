import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { getForecast } from '../handlers/get_forecast';
import type { GetForecastInput, Forecast } from '../schema';

// Helper to get a forecast for a given city
const fetch = async (city: string): Promise<Forecast> => {
  const input: GetForecastInput = { city };
  return await getForecast(input);
};

describe('getForecast handler', () => {
  // Even though no DB is used, keep the DB lifecycle for consistency with other tests.
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns a forecast with correct structure and tomorrow date', async () => {
    const city = 'Testville';
    const result = await fetch(city);

    expect(result.city).toBe(city);
    // Date should be roughly tomorrow (allow a 2 day window due to test run time)
    const today = new Date();
    const diff = result.date.getTime() - today.getTime();
    expect(diff).toBeGreaterThanOrEqual(20 * 60 * 60 * 1000); // >20h
    expect(diff).toBeLessThanOrEqual(48 * 60 * 60 * 1000); // <48h
    expect(typeof result.min_temperature).toBe('number');
    expect(typeof result.max_temperature).toBe('number');
    expect(typeof result.precipitation).toBe('number');
    expect(['Good Idea', 'Not a Good Idea']).toContain(result.recommendation);
  });

  it('produces deterministic output for the same city', async () => {
    const city = 'DeterministicTown';
    const first = await fetch(city);
    const second = await fetch(city);
    expect(first).toEqual(second);
  });

  it('applies recommendation logic correctly', async () => {
    // Choose a city that will generate max_temperature >=15 && <=25 and precipitation <1
    // Based on hash logic: max = baseTemp+5, precipitation = (hash%10)*0.5
    // We need precipitation <1 => hash%10 must be 0 => hash %10 ==0
    // Also max_temp between 15 and 25 inclusive.
    // Let's craft city name where sum of char codes %10 ==0 and (sum%15)+10+5 between 15-25.
    // Simple choice: "A" char code 65 => 65%10=5 not 0.
    // Use "J" char code 74 => 74%10=4.
    // We can brute force small list.
    const candidates = ['JZ', 'KQ', 'LM']; // placeholder, will compute dynamically.
    let chosen: string | null = null;
    for (const c of candidates) {
      const hash = c.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const precipitation = (hash % 10) * 0.5;
      const baseTemp = (hash % 15) + 10;
      const maxTemp = baseTemp + 5;
      if (precipitation < 1 && maxTemp >= 15 && maxTemp <= 25) {
        chosen = c;
        break;
      }
    }
    if (!chosen) {
      // Fallback to a known city that satisfies condition by manual calculation.
      // Use city "AAAA" => char code 65*4 =260, hash%10=0, baseTemp=(260%15)+10 = (5)+10=15, max=20.
      chosen = 'AAAA';
    }
    const forecast = await fetch(chosen);
    expect(forecast.recommendation).toBe('Good Idea');

    // Now a city that does NOT meet criteria
    const badCity = 'BBBB'; // char code 66*4=264, hash%10=4 => precipitation 2 >1
    const badForecast = await fetch(badCity);
    expect(badForecast.recommendation).toBe('Not a Good Idea');
  });
});
