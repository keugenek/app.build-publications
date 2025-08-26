import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherCacheTable } from '../db/schema';
import { type GetTripSuggestionInput } from '../schema';
import { getTripSuggestion } from '../handlers/get_trip_suggestion';
import { eq, and } from 'drizzle-orm';

// Mock fetch globally
const mockFetch = mock();
(global as any).fetch = mockFetch;

// Test input for Berlin
const testInput: GetTripSuggestionInput = {
  city: 'Berlin'
};

// Mock weather API responses
const mockGeocodingResponse = {
  results: [{
    latitude: 52.5244,
    longitude: 13.4105
  }]
};

const mockWeatherResponse = {
  daily: {
    temperature_2m_max: [18.5],
    precipitation_sum: [2.3],
    weather_code: [2]
  }
};

describe('getTripSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch weather data from API and return trip suggestion', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    // Verify result structure
    expect(result.city).toEqual('Berlin');
    expect(result.is_good_idea).toBe(true); // 18.5°C and 2.3mm precipitation should be good
    expect(result.temperature).toEqual(18.5);
    expect(result.precipitation).toEqual(2.3);
    expect(result.weather_description).toEqual('Partly cloudy');
    expect(result.date).toBeDefined();
    expect(result.reason).toContain('pleasant temperature');

    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should cache weather data in database', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    // Check that data was cached in database
    const cached = await db.select()
      .from(weatherCacheTable)
      .where(and(
        eq(weatherCacheTable.city, 'Berlin'),
        eq(weatherCacheTable.date, result.date)
      ))
      .execute();

    expect(cached).toHaveLength(1);
    expect(cached[0].city).toEqual('Berlin');
    expect(cached[0].temperature).toEqual(18.5);
    expect(cached[0].precipitation).toEqual(2.3);
    expect(cached[0].weather_description).toEqual('Partly cloudy');
    expect(cached[0].created_at).toBeInstanceOf(Date);
  });

  it('should use cached data when available', async () => {
    // Insert cached weather data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    await db.insert(weatherCacheTable)
      .values({
        city: 'Berlin',
        temperature: 22.0,
        precipitation: 0.0,
        weather_description: 'Clear sky',
        date: tomorrowDate
      })
      .execute();

    const result = await getTripSuggestion(testInput);

    // Should use cached data, not make API calls
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.city).toEqual('Berlin');
    expect(result.temperature).toEqual(22.0);
    expect(result.precipitation).toEqual(0.0);
    expect(result.weather_description).toEqual('Clear sky');
    expect(result.is_good_idea).toBe(true);
    expect(result.reason).toContain('pleasant temperature');
    expect(result.reason).toContain('no precipitation expected');
  });

  it('should return false for poor weather conditions - too cold', async () => {
    const coldWeatherResponse = {
      daily: {
        temperature_2m_max: [5.0], // Too cold
        precipitation_sum: [0.0],
        weather_code: [0]
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(coldWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.temperature).toEqual(5.0);
    expect(result.reason).toContain('temperature too cold');
  });

  it('should return false for poor weather conditions - too hot', async () => {
    const hotWeatherResponse = {
      daily: {
        temperature_2m_max: [30.0], // Too hot
        precipitation_sum: [0.0],
        weather_code: [0]
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(hotWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.temperature).toEqual(30.0);
    expect(result.reason).toContain('temperature too hot');
  });

  it('should return false for high precipitation', async () => {
    const rainyWeatherResponse = {
      daily: {
        temperature_2m_max: [20.0], // Good temperature
        precipitation_sum: [15.0], // High precipitation
        weather_code: [63]
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rainyWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    expect(result.is_good_idea).toBe(false);
    expect(result.precipitation).toEqual(15.0);
    expect(result.weather_description).toEqual('Moderate rain');
    expect(result.reason).toContain('high precipitation expected');
  });

  it('should handle city not found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }) // No results
    });

    await expect(getTripSuggestion({ city: 'NonexistentCity' }))
      .rejects.toThrow(/NonexistentCity.*not found/i);
  });

  it('should handle geocoding API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/Geocoding API error: 500/i);
  });

  it('should handle weather API error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503
      });

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/Weather API error: 503/i);
  });

  it('should handle missing weather data', async () => {
    const emptyWeatherResponse = {
      daily: {
        temperature_2m_max: [],
        precipitation_sum: [],
        weather_code: []
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyWeatherResponse)
      });

    await expect(getTripSuggestion(testInput))
      .rejects.toThrow(/No weather data available/i);
  });

  it('should use tomorrow\'s date correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      });

    const result = await getTripSuggestion(testInput);

    // Verify date is tomorrow in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = tomorrow.toISOString().split('T')[0];

    expect(result.date).toEqual(expectedDate);
  });

  it('should handle weather code mapping correctly', async () => {
    const weatherResponseWithCode = {
      daily: {
        temperature_2m_max: [15.0],
        precipitation_sum: [1.0],
        weather_code: [95] // Thunderstorm
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(weatherResponseWithCode)
      });

    const result = await getTripSuggestion(testInput);

    expect(result.weather_description).toEqual('Thunderstorm');
  });

  it('should handle unknown weather code', async () => {
    const weatherResponseWithUnknownCode = {
      daily: {
        temperature_2m_max: [15.0],
        precipitation_sum: [1.0],
        weather_code: [999] // Unknown code
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(weatherResponseWithUnknownCode)
      });

    const result = await getTripSuggestion(testInput);

    expect(result.weather_description).toEqual('Unknown weather');
  });
});
