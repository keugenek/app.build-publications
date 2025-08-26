import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { type TripSuggestionInput } from '../schema';
import { getTripSuggestion } from '../handlers/get_trip_suggestion';
import { eq } from 'drizzle-orm';

// Mock the global fetch function
const mockFetch = mock(() => Promise.resolve(new Response())) as any;

// Helper function to create mock geocoding response
const createMockGeocodingResponse = (city: string, lat: number = 52.52, lon: number = 13.405) => ({
  results: [
    {
      name: city,
      latitude: lat,
      longitude: lon,
      country: 'Germany'
    }
  ]
});

// Helper function to create mock weather response
const createMockWeatherResponse = (
  temperature: number = 20,
  precipitation: number = 0,
  weatherCode: number = 0
) => ({
  daily: {
    temperature_2m_max: [temperature],
    precipitation_sum: [precipitation],
    weather_code: [weatherCode]
  }
});

// Test inputs
const testInput: TripSuggestionInput = {
  city: 'Berlin'
};

const unknownCityInput: TripSuggestionInput = {
  city: 'NonExistentCity123'
};

describe('getTripSuggestion', () => {
  beforeEach(async () => {
    await createDB();
    // Reset the mock before each test
    mockFetch.mockClear();
    global.fetch = mockFetch;
  });

  afterEach(resetDB);

  it('should return trip suggestion with good weather conditions', async () => {
    // Mock geocoding API response
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(20, 1, 0))));

    const result = await getTripSuggestion(testInput);

    // Verify response structure
    expect(result.city).toBe('Berlin');
    expect(result.is_good_idea).toBe(true);
    expect(result.reason).toContain('Perfect weather conditions');
    expect(result.weather_details.max_temperature).toBe(20);
    expect(result.weather_details.precipitation).toBe(1);
    expect(result.weather_details.weather_description).toBe('Clear sky');
    expect(result.forecast_date).toBeDefined();

    // Verify forecast_date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = tomorrow.toISOString().split('T')[0];
    expect(result.forecast_date).toBe(expectedDate);
  });

  it('should return negative suggestion for cold and rainy weather', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(5, 10, 63))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Too cold (5°C) and rainy (10mm)');
    expect(result.weather_details.max_temperature).toBe(5);
    expect(result.weather_details.precipitation).toBe(10);
    expect(result.weather_details.weather_description).toBe('Moderate rain');
  });

  it('should return negative suggestion for hot and rainy weather', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(30, 8, 65))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Too hot (30°C) and rainy (8mm)');
    expect(result.weather_details.max_temperature).toBe(30);
    expect(result.weather_details.precipitation).toBe(8);
    expect(result.weather_details.weather_description).toBe('Heavy rain');
  });

  it('should return negative suggestion for cold weather only', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(3, 0, 0))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Weather is too cold (3°C)');
    expect(result.weather_details.max_temperature).toBe(3);
    expect(result.weather_details.precipitation).toBe(0);
  });

  it('should return negative suggestion for hot weather only', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(35, 2, 1))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Weather is too hot (35°C)');
    expect(result.weather_details.max_temperature).toBe(35);
    expect(result.weather_details.precipitation).toBe(2);
    expect(result.weather_details.weather_description).toBe('Mainly clear');
  });

  it('should return negative suggestion for heavy precipitation only', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(18, 12, 80))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Heavy precipitation expected (12mm)');
    expect(result.weather_details.max_temperature).toBe(18);
    expect(result.weather_details.precipitation).toBe(12);
    expect(result.weather_details.weather_description).toBe('Slight rain showers');
  });

  it('should return negative suggestion for severe weather (thunderstorms)', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(22, 3, 95))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Severe weather conditions expected (thunderstorms or hail)');
    expect(result.weather_details.weather_description).toBe('Thunderstorm');
  });

  it('should return negative suggestion for severe weather with hail', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(18, 1, 99))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.reason).toContain('Severe weather conditions expected (thunderstorms or hail)');
    expect(result.weather_details.weather_description).toBe('Thunderstorm with heavy hail');
  });

  it('should handle unknown weather codes', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(20, 1, 50))));

    const result = await getTripSuggestion(testInput);

    expect(result.weather_details.weather_description).toBe('Unknown weather condition');
    expect(result.is_good_idea).toBe(true); // Should be good since temp is 20°C, precipitation is 1mm, and weather code < 95
  });

  it('should save trip history to database', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(22, 0, 1))));

    await getTripSuggestion(testInput);

    // Add small delay to allow async save to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if record was saved to database
    const tripHistory = await db.select()
      .from(tripHistoryTable)
      .where(eq(tripHistoryTable.city, 'Berlin'))
      .execute();

    expect(tripHistory).toHaveLength(1);
    expect(tripHistory[0].city).toBe('Berlin');
    expect(tripHistory[0].is_good_idea).toBe(true);
    expect(tripHistory[0].max_temperature).toBe(22);
    expect(tripHistory[0].precipitation).toBe(0);
    expect(tripHistory[0].weather_description).toBe('Mainly clear');
    expect(tripHistory[0].forecast_date).toBeInstanceOf(Date);
    expect(tripHistory[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for unknown city', async () => {
    // Mock geocoding API to return no results
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [] }))
    );

    await expect(getTripSuggestion(unknownCityInput))
      .rejects.toThrow(/City "NonExistentCity123" not found/i);
  });

  it('should throw error when geocoding API fails', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/Failed to find coordinates for city/i);
  });

  it('should throw error when weather API fails', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/Failed to fetch weather data/i);
  });

  it('should throw error when weather API returns no data', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify({ daily: {} })));

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/No weather data available for the requested date/i);
  });

  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/Failed to find coordinates for city/i);
  });

  it('should test boundary conditions for temperature and precipitation', async () => {
    // Test exactly at the boundary (10°C and 5mm precipitation)
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(10, 4.9, 0))));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(true);
    expect(result.reason).toContain('Perfect weather conditions');

    // Clear mocks for second test
    mockFetch.mockClear();

    // Test just outside the boundary (9°C and 5.1mm precipitation)
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(9, 5.1, 0))));

    const result2 = await getTripSuggestion(testInput);

    expect(result2.is_good_idea).toBe(false);
    expect(result2.reason).toContain('Too cold (9°C) and rainy (5.1mm)');
  });

  it('should handle missing precipitation data (defaults to 0)', async () => {
    const weatherResponseWithoutPrecipitation = {
      daily: {
        temperature_2m_max: [20],
        precipitation_sum: [null], // null precipitation
        weather_code: [0]
      }
    };

    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(weatherResponseWithoutPrecipitation)));

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(true);
    expect(result.weather_details.precipitation).toBe(0);
  });

  it('should continue processing even if database save fails', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockGeocodingResponse('Berlin'))))
      .mockResolvedValueOnce(new Response(JSON.stringify(createMockWeatherResponse(20, 1, 0))));

    const result = await getTripSuggestion(testInput);

    // Should still return the trip suggestion even if save fails
    expect(result.city).toBe('Berlin');
    expect(result.is_good_idea).toBe(true);
  });
});
