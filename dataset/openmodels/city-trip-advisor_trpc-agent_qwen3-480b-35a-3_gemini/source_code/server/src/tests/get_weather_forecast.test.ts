import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { getWeatherForecast } from '../handlers/get_weather_forecast';
import { type CityInput } from '../schema';

describe('getWeatherForecast', () => {
  // Store original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset all mocks before each test
  });
  
  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should return weather forecast for a valid city', async () => {
    // Mock the geocoding API response
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        results: [{
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'London'
        }]
      })
    };

    // Mock the forecast API response
    const mockForecastResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        daily: {
          time: ['2023-06-01', '2023-06-02'],
          temperature_2m_max: [20, 22],
          precipitation_probability_mean: [10, 15]
        }
      })
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve(mockForecastResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'London' };
    const result = await getWeatherForecast(input);

    // Validate the result structure
    expect(result).toEqual({
      city: 'London',
      maxTemperature: 22,
      precipitationProbability: 15,
      isGoodIdea: true,
      forecastDate: '2023-06-02'
    });
  });

  it('should determine it is a good idea to visit when conditions are favorable', async () => {
    // Mock the geocoding API response
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        results: [{
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'London'
        }]
      })
    };

    // Mock the forecast API response with favorable conditions
    const mockForecastResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        daily: {
          time: ['2023-06-01', '2023-06-02'],
          temperature_2m_max: [20, 22], // Between 15 and 25
          precipitation_probability_mean: [10, 25] // Less than 30
        }
      })
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve(mockForecastResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'London' };
    const result = await getWeatherForecast(input);

    expect(result.isGoodIdea).toBe(true);
    expect(result.maxTemperature).toBe(22);
    expect(result.precipitationProbability).toBe(25);
  });

  it('should determine it is not a good idea to visit when temperature is too low', async () => {
    // Mock the geocoding API response
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        results: [{
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'London'
        }]
      })
    };

    // Mock the forecast API response with cold temperature
    const mockForecastResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        daily: {
          time: ['2023-06-01', '2023-06-02'],
          temperature_2m_max: [20, 14], // Below 15
          precipitation_probability_mean: [10, 15] // Less than 30
        }
      })
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve(mockForecastResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'London' };
    const result = await getWeatherForecast(input);

    expect(result.isGoodIdea).toBe(false);
  });

  it('should determine it is not a good idea to visit when temperature is too high', async () => {
    // Mock the geocoding API response
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        results: [{
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'London'
        }]
      })
    };

    // Mock the forecast API response with hot temperature
    const mockForecastResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        daily: {
          time: ['2023-06-01', '2023-06-02'],
          temperature_2m_max: [20, 26], // Above 25
          precipitation_probability_mean: [10, 15] // Less than 30
        }
      })
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve(mockForecastResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'London' };
    const result = await getWeatherForecast(input);

    expect(result.isGoodIdea).toBe(false);
  });

  it('should determine it is not a good idea to visit when precipitation probability is too high', async () => {
    // Mock the geocoding API response
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        results: [{
          latitude: 51.5074,
          longitude: -0.1278,
          name: 'London'
        }]
      })
    };

    // Mock the forecast API response with high precipitation
    const mockForecastResponse: any = {
      ok: true,
      json: () => Promise.resolve({
        daily: {
          time: ['2023-06-01', '2023-06-02'],
          temperature_2m_max: [20, 22], // Between 15 and 25
          precipitation_probability_mean: [10, 35] // Above 30
        }
      })
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve(mockForecastResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'London' };
    const result = await getWeatherForecast(input);

    expect(result.isGoodIdea).toBe(false);
  });

  it('should throw an error for an invalid city', async () => {
    // Mock the geocoding API response for city not found
    const mockGeocodingResponse: any = {
      ok: true,
      json: () => Promise.resolve({})
    };

    // Mock fetch implementation
    global.fetch = ((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve(mockGeocodingResponse);
      }
      return Promise.reject(new Error('Unexpected URL'));
    }) as any;

    const input: CityInput = { cityName: 'NonExistentCity' };
    
    await expect(getWeatherForecast(input)).rejects.toThrow(/Failed to get weather forecast/);
  });
});
