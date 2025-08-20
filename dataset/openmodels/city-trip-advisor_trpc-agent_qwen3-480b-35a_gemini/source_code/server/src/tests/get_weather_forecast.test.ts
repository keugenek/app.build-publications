import { beforeEach, describe, expect, it } from 'bun:test';
import { getWeatherForecast } from '../handlers/get_weather_forecast';
import { type GetWeatherInput } from '../schema';

describe('getWeatherForecast', () => {
  // Store the original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset mock before each test
    global.fetch = originalFetch;
  });

  it('should return weather forecast for a valid city with good conditions', async () => {
    const input: GetWeatherInput = { city: 'London' };
    
    // Get tomorrow's date in the correct format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Create a proper mock for fetch that includes all properties
    const mockFetch = (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(new Response(JSON.stringify({
          results: [{ latitude: 51.5074, longitude: -0.1278 }]
        })));
      } else {
        // Weather API response with tomorrow's date
        return Promise.resolve(new Response(JSON.stringify({
          daily: {
            time: [tomorrowDate],
            temperature_2m_max: [20.5],
            precipitation_probability_mean: [15]
          }
        })));
      }
    };
    
    // Add all required properties to mockFetch
    Object.assign(mockFetch, {
      preconnect: () => {},
      prefetch: () => {},
      preload: () => {},
      requests: {
        clear: () => {}
      }
    });
    
    // Replace global fetch with our mock
    global.fetch = mockFetch as any;

    const result = await getWeatherForecast(input);
    
    expect(result.city).toEqual('London');
    expect(result.temperature).toEqual(20.5);
    expect(result.precipitation_probability).toEqual(15);
    expect(result.is_good_idea).toBe(true);
    expect(result.date).toEqual(tomorrowDate);
  });

  it('should return weather forecast for a valid city with bad conditions', async () => {
    const input: GetWeatherInput = { city: 'Miami' };
    
    // Get tomorrow's date in the correct format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Create a proper mock for fetch that includes all properties
    const mockFetch = (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(new Response(JSON.stringify({
          results: [{ latitude: 25.7617, longitude: -80.1918 }]
        })));
      } else {
        // Weather API response with tomorrow's date and bad conditions
        return Promise.resolve(new Response(JSON.stringify({
          daily: {
            time: [tomorrowDate],
            temperature_2m_max: [35.0], // Too hot
            precipitation_probability_mean: [50] // High precipitation
          }
        })));
      }
    };
    
    // Add all required properties to mockFetch
    Object.assign(mockFetch, {
      preconnect: () => {},
      prefetch: () => {},
      preload: () => {},
      requests: {
        clear: () => {}
      }
    });
    
    // Replace global fetch with our mock
    global.fetch = mockFetch as any;

    const result = await getWeatherForecast(input);
    
    expect(result.city).toEqual('Miami');
    expect(result.temperature).toEqual(35.0);
    expect(result.precipitation_probability).toEqual(50);
    expect(result.is_good_idea).toBe(false); // Too hot and high precipitation
    expect(result.date).toEqual(tomorrowDate);
  });

  it('should handle city not found error', async () => {
    const input: GetWeatherInput = { city: 'NonexistentCity' };
    
    // Create a proper mock for fetch that includes all properties
    const mockFetch = () => {
      return Promise.resolve(new Response(JSON.stringify({
        results: []
      })));
    };
    
    // Add all required properties to mockFetch
    Object.assign(mockFetch, {
      preconnect: () => {},
      prefetch: () => {},
      preload: () => {},
      requests: {
        clear: () => {}
      }
    });
    
    // Replace global fetch with our mock
    global.fetch = mockFetch as any;

    await expect(getWeatherForecast(input))
      .rejects
      .toThrow(/City "NonexistentCity" not found/);
  });
});
