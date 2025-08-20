import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { getWeatherForecast } from '../handlers/get_weather_forecast';

// Mock fetch globally for testing
const originalFetch = global.fetch;

describe('getWeatherForecast', () => {
  beforeAll(() => {
    // Set up fetch mock
    (global as any).fetch = async (url: string) => {
      const urlString = url.toString();
      
      // Mock geocoding API response
      if (urlString.includes('geocoding-api.open-meteo.com')) {
        if (urlString.includes('London')) {
          return new Response(JSON.stringify({
            results: [{
              latitude: 51.5074,
              longitude: -0.1278,
              name: 'London',
              country: 'United Kingdom'
            }]
          }), { status: 200 });
        } else if (urlString.includes('NonexistentCity')) {
          return new Response(JSON.stringify({ results: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      
      // Mock weather API response
      if (urlString.includes('api.open-meteo.com')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        return new Response(JSON.stringify({
          daily: {
            time: [tomorrowStr],
            temperature_2m_min: [12.5],
            temperature_2m_max: [20.3],
            precipitation_sum: [2.4]
          }
        }), { status: 200 });
      }
      
      // Fallback for unexpected URLs
      return new Response('Not found', { status: 404 });
    };
  });

  afterAll(() => {
    // Restore original fetch
    (global as any).fetch = originalFetch;
  });

  it('should fetch weather forecast for a valid city', async () => {
    const result = await getWeatherForecast('London');
    
    // Verify structure and types
    expect(typeof result.temperature_min).toBe('number');
    expect(typeof result.temperature_max).toBe('number');
    expect(typeof result.precipitation).toBe('number');
    expect(typeof result.date).toBe('string');
    
    // Verify expected values from mock
    expect(result.temperature_min).toBe(12.5);
    expect(result.temperature_max).toBe(20.3);
    expect(result.precipitation).toBe(2.4);
    
    // Verify date format (YYYY-MM-DD)
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Verify it's tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = tomorrow.toISOString().split('T')[0];
    expect(result.date).toBe(expectedDate);
  });

  it('should handle city not found', async () => {
    await expect(getWeatherForecast('NonexistentCity'))
      .rejects.toThrow(/City.*not found/i);
  });

  it('should handle empty city name gracefully', async () => {
    // Empty city should still make API call but likely return no results
    await expect(getWeatherForecast(''))
      .rejects.toThrow();
  });

  it('should handle geocoding API errors', async () => {
    // Temporarily override fetch to simulate API error
    const originalMockFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.toString().includes('geocoding-api')) {
        return new Response('Server Error', { status: 500 });
      }
      return originalMockFetch(url);
    };

    await expect(getWeatherForecast('TestCity'))
      .rejects.toThrow(/Geocoding API error/i);

    // Restore mock
    (global as any).fetch = originalMockFetch;
  });

  it('should handle weather API errors', async () => {
    // Temporarily override fetch to simulate weather API error
    const originalMockFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes('geocoding-api')) {
        return new Response(JSON.stringify({
          results: [{
            latitude: 51.5074,
            longitude: -0.1278,
            name: 'London',
            country: 'United Kingdom'
          }]
        }), { status: 200 });
      }
      
      if (urlString.includes('api.open-meteo.com')) {
        return new Response('Weather Service Unavailable', { status: 503 });
      }
      
      return new Response('Not found', { status: 404 });
    };

    await expect(getWeatherForecast('London'))
      .rejects.toThrow(/Weather API error/i);

    // Restore mock
    (global as any).fetch = originalMockFetch;
  });

  it('should handle invalid weather data format', async () => {
    // Temporarily override fetch to return invalid weather data
    const originalMockFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes('geocoding-api')) {
        return new Response(JSON.stringify({
          results: [{
            latitude: 51.5074,
            longitude: -0.1278,
            name: 'London',
            country: 'United Kingdom'
          }]
        }), { status: 200 });
      }
      
      if (urlString.includes('api.open-meteo.com')) {
        return new Response(JSON.stringify({
          daily: {
            time: [],
            temperature_2m_min: [],
            temperature_2m_max: [],
            precipitation_sum: []
          }
        }), { status: 200 });
      }
      
      return new Response('Not found', { status: 404 });
    };

    await expect(getWeatherForecast('London'))
      .rejects.toThrow(/No weather data available/i);

    // Restore mock
    (global as any).fetch = originalMockFetch;
  });

  it('should validate numeric weather values', async () => {
    // Test with invalid numeric data
    const originalMockFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      const urlString = url.toString();
      
      if (urlString.includes('geocoding-api')) {
        return new Response(JSON.stringify({
          results: [{
            latitude: 51.5074,
            longitude: -0.1278,
            name: 'London',
            country: 'United Kingdom'
          }]
        }), { status: 200 });
      }
      
      if (urlString.includes('api.open-meteo.com')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        return new Response(JSON.stringify({
          daily: {
            time: [tomorrowStr],
            temperature_2m_min: [null], // Invalid data
            temperature_2m_max: [20.3],
            precipitation_sum: [2.4]
          }
        }), { status: 200 });
      }
      
      return new Response('Not found', { status: 404 });
    };

    await expect(getWeatherForecast('London'))
      .rejects.toThrow(/Invalid weather data/i);

    // Restore mock
    (global as any).fetch = originalMockFetch;
  });
});
