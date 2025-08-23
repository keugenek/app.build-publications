import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getTripSuggestion } from '../handlers/get_trip_suggestion';
import { type TripSuggestionInput } from '../schema';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { createDB, resetDB } from '../helpers';
import { eq } from 'drizzle-orm';

// Reference to the original fetch function
let originalFetch: typeof global.fetch;

describe('getTripSuggestion', () => {
  beforeEach(async () => {
    // Setup database
    await createDB();
    
    // Store original fetch
    originalFetch = global.fetch;
  });

  afterEach(async () => {
    // Restore original fetch
    global.fetch = originalFetch;
    
    // Reset database
    await resetDB();
  });

  it('should return weather data for a valid city', async () => {
    // Mock fetch implementation
    global.fetch = (async (url: string | URL | Request) => {
      if (typeof url === 'string' && url.includes('geocoding-api.open-meteo.com')) {
        return new Response(JSON.stringify({
          results: [
            {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          ],
        }));
      } else if (typeof url === 'string' && url.includes('api.open-meteo.com')) {
        return new Response(JSON.stringify({
          daily: {
            temperature_2m_max: [22.5],
            precipitation_probability_mean: [15],
          },
        }));
      }
      throw new Error('Unexpected URL');
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'New York',
    };

    const result = await getTripSuggestion(input);

    // Test the structure of the response
    expect(result).toBeDefined();
    expect(result.city).toBe('New York');
    expect(typeof result.maxTemperature).toBe('number');
    expect(typeof result.precipitationProbability).toBe('number');
    expect(typeof result.isGoodIdea).toBe('boolean');

    // Test specific values based on our mock data
    expect(result.maxTemperature).toBe(22.5);
    expect(result.precipitationProbability).toBe(15);
    expect(result.isGoodIdea).toBe(true); // 22.5°C and 15% precipitation should be a good idea

    // Check that the result was saved to database
    const savedRecords = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'New York'))
      .execute();

    expect(savedRecords).toHaveLength(1);
    expect(parseFloat(savedRecords[0].max_temperature)).toBe(22.5);
    expect(savedRecords[0].precipitation_probability).toBe(15);
    expect(parseFloat(savedRecords[0].is_good_idea)).toBe(1); // 1 for true
  });

  it('should determine it\'s a good idea to visit when conditions are favorable', async () => {
    // Mock fetch implementation
    global.fetch = (async (url: string | URL | Request) => {
      if (typeof url === 'string' && url.includes('geocoding-api.open-meteo.com')) {
        return new Response(JSON.stringify({
          results: [
            {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          ],
        }));
      } else if (typeof url === 'string' && url.includes('api.open-meteo.com')) {
        return new Response(JSON.stringify({
          daily: {
            temperature_2m_max: [20], // Within the good range (15-25°C)
            precipitation_probability_mean: [20], // Below threshold (30%)
          },
        }));
      }
      throw new Error('Unexpected URL');
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'Test City',
    };

    const result = await getTripSuggestion(input);
    expect(result.isGoodIdea).toBe(true);
  });

  it('should determine it\'s not a good idea to visit when temperature is too low', async () => {
    // Mock fetch implementation
    global.fetch = (async (url: string | URL | Request) => {
      if (typeof url === 'string' && url.includes('geocoding-api.open-meteo.com')) {
        return new Response(JSON.stringify({
          results: [
            {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          ],
        }));
      } else if (typeof url === 'string' && url.includes('api.open-meteo.com')) {
        return new Response(JSON.stringify({
          daily: {
            temperature_2m_max: [10], // Below the good range (<15°C)
            precipitation_probability_mean: [20],
          },
        }));
      }
      throw new Error('Unexpected URL');
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'Cold City',
    };

    const result = await getTripSuggestion(input);
    expect(result.isGoodIdea).toBe(false);
  });

  it('should determine it\'s not a good idea to visit when precipitation is too high', async () => {
    // Mock fetch implementation
    global.fetch = (async (url: string | URL | Request) => {
      if (typeof url === 'string' && url.includes('geocoding-api.open-meteo.com')) {
        return new Response(JSON.stringify({
          results: [
            {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          ],
        }));
      } else if (typeof url === 'string' && url.includes('api.open-meteo.com')) {
        return new Response(JSON.stringify({
          daily: {
            temperature_2m_max: [20], // Within the good range
            precipitation_probability_mean: [40], // Above threshold (>30%)
          },
        }));
      }
      throw new Error('Unexpected URL');
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'Rainy City',
    };

    const result = await getTripSuggestion(input);
    expect(result.isGoodIdea).toBe(false);
  });

  it('should throw an error for invalid city', async () => {
    // Mock fetch implementation for no results
    global.fetch = (async (url: string | URL | Request) => {
      if (typeof url === 'string' && url.includes('geocoding-api.open-meteo.com')) {
        return new Response(JSON.stringify({
          results: [], // No results found
        }));
      }
      throw new Error('Unexpected URL');
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'InvalidCityName',
    };

    await expect(getTripSuggestion(input)).rejects.toThrow(/Failed to get trip suggestion/);
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetch implementation for API error
    global.fetch = (async (_url: string | URL | Request) => {
      return new Response(null, { status: 500 });
    }) as typeof global.fetch;

    const input: TripSuggestionInput = {
      city: 'Error City',
    };

    await expect(getTripSuggestion(input)).rejects.toThrow(/Failed to get trip suggestion/);
  });
});
