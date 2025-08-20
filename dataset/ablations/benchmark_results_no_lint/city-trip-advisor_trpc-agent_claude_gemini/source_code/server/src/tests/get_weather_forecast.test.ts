import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { getWeatherForecast } from '../handlers/get_weather_forecast';

// Mock successful responses for testing
const mockGeocodingResponse = {
  results: [
    {
      latitude: 51.5074,
      longitude: -0.1278,
      name: 'London',
      country: 'United Kingdom'
    }
  ]
};

const mockWeatherResponse = {
  daily: {
    time: ['2024-01-15'],
    temperature_2m_max: [15.5],
    precipitation_sum: [2.3],
    weather_code: [61] // Slight rain
  }
};

describe('getWeatherForecast', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch weather forecast for a valid city', async () => {
    // Mock successful API responses
    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(mockWeatherResponse)
        } as Response;
      }
    }) as any;

    const result = await getWeatherForecast('London');

    expect(result.temperature).toBe(15.5);
    expect(result.precipitation).toBe(2.3);
    expect(result.weather_description).toBe('Slight rain');
    expect(typeof result.temperature).toBe('number');
    expect(typeof result.precipitation).toBe('number');
    expect(typeof result.weather_description).toBe('string');
  });

  it('should handle different weather codes correctly', async () => {
    const clearSkyResponse = {
      ...mockWeatherResponse,
      daily: {
        ...mockWeatherResponse.daily,
        weather_code: [0] // Clear sky
      }
    };

    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(clearSkyResponse)
        } as Response;
      }
    }) as any;

    const result = await getWeatherForecast('London');

    expect(result.weather_description).toBe('Clear sky');
  });

  it('should handle unknown weather codes', async () => {
    const unknownWeatherResponse = {
      ...mockWeatherResponse,
      daily: {
        ...mockWeatherResponse.daily,
        weather_code: [999] // Unknown code
      }
    };

    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(unknownWeatherResponse)
        } as Response;
      }
    }) as any;

    const result = await getWeatherForecast('London');

    expect(result.weather_description).toBe('Unknown weather');
  });

  it('should throw error when city is not found', async () => {
    global.fetch = (async () => {
      return {
        ok: true,
        json: () => Promise.resolve({ results: [] })
      } as Response;
    }) as any;

    await expect(getWeatherForecast('NonexistentCity')).rejects.toThrow(/not found/i);
  });

  it('should throw error when geocoding API fails', async () => {
    global.fetch = (async () => {
      return {
        ok: false,
        status: 500
      } as Response;
    }) as any;

    await expect(getWeatherForecast('London')).rejects.toThrow(/geocoding api error/i);
  });

  it('should throw error when weather API fails', async () => {
    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: false,
          status: 503
        } as Response;
      }
    }) as any;

    await expect(getWeatherForecast('London')).rejects.toThrow(/weather api error/i);
  });

  it('should handle empty weather data', async () => {
    const emptyWeatherResponse = {
      daily: {
        time: [],
        temperature_2m_max: [],
        precipitation_sum: [],
        weather_code: []
      }
    };

    let callCount = 0;
    global.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(emptyWeatherResponse)
        } as Response;
      }
    }) as any;

    await expect(getWeatherForecast('London')).rejects.toThrow(/no weather data available/i);
  });

  it('should make API calls with expected city parameter', async () => {
    const mockFetchCalls: string[] = [];
    
    global.fetch = (async (url: string) => {
      mockFetchCalls.push(url);
      if (url.includes('geocoding-api')) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(mockWeatherResponse)
        } as Response;
      }
    }) as any;

    await getWeatherForecast('London');

    // Verify geocoding API call
    expect(mockFetchCalls[0]).toContain('geocoding-api.open-meteo.com/v1/search?name=London&count=1');
    
    // Verify weather API call with coordinates
    expect(mockFetchCalls[1]).toContain('latitude=51.5074');
    expect(mockFetchCalls[1]).toContain('longitude=-0.1278');
  });

  it('should handle special characters in city names', async () => {
    const mockFetchCalls: string[] = [];
    
    global.fetch = (async (url: string) => {
      mockFetchCalls.push(url);
      if (url.includes('geocoding-api')) {
        return {
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response;
      } else {
        return {
          ok: true,
          json: () => Promise.resolve(mockWeatherResponse)
        } as Response;
      }
    }) as any;

    await getWeatherForecast('São Paulo');

    // Verify that the city name is properly encoded
    expect(mockFetchCalls[0]).toContain('name=S%C3%A3o%20Paulo');
  });
});
