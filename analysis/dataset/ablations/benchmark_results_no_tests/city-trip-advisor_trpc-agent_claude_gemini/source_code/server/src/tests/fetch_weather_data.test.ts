import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { fetchWeatherData } from '../handlers/fetch_weather_data';

// Mock responses for testing
const mockGeocodingResponse = {
  results: [{
    latitude: 52.52,
    longitude: 13.405,
    name: 'Berlin',
    country: 'Germany'
  }]
};

const mockWeatherResponse = {
  daily: {
    time: ['2024-01-15'],
    temperature_2m_max: [5.2],
    temperature_2m_min: [-1.8],
    precipitation_sum: [2.5],
    weathercode: [61]
  }
};

const mockEmptyGeocodingResponse = {
  results: []
};

const mockEmptyWeatherResponse = {
  daily: {
    time: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_sum: [],
    weathercode: []
  }
};

describe('fetchWeatherData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch weather data successfully', async () => {
    // Mock the global fetch function
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      } as Response);

    const result = await fetchWeatherData('Berlin', '2024-01-15');

    // Verify the result structure and values
    expect(result.temperature).toBe(1.7); // Average of 5.2 and -1.8
    expect(result.precipitation).toBe(2.5);
    expect(result.weather_description).toBe('Slight rain'); // Weather code 61
    expect(result.date).toBe('2024-01-15');

    // Verify API calls were made correctly
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, 
      'https://geocoding-api.open-meteo.com/v1/search?name=Berlin'
    );
    expect(mockFetch).toHaveBeenNthCalledWith(2,
      'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.405&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&start_date=2024-01-15&end_date=2024-01-15'
    );

    mockFetch.mockRestore();
  });

  it('should handle city names with spaces and special characters', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse)
      } as Response);

    await fetchWeatherData('New York City', '2024-01-15');

    // Verify URL encoding
    expect(mockFetch).toHaveBeenNthCalledWith(1,
      'https://geocoding-api.open-meteo.com/v1/search?name=New%20York%20City'
    );

    mockFetch.mockRestore();
  });

  it('should handle zero precipitation correctly', async () => {
    const weatherResponseWithZeroPrecipitation = {
      daily: {
        time: ['2024-01-15'],
        temperature_2m_max: [20.0],
        temperature_2m_min: [15.0],
        precipitation_sum: [0],
        weathercode: [0]
      }
    };

    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(weatherResponseWithZeroPrecipitation)
      } as Response);

    const result = await fetchWeatherData('Berlin', '2024-01-15');

    expect(result.temperature).toBe(17.5); // Average of 20 and 15
    expect(result.precipitation).toBe(0);
    expect(result.weather_description).toBe('Clear sky'); // Weather code 0

    mockFetch.mockRestore();
  });

  it('should handle unknown weather codes', async () => {
    const weatherResponseWithUnknownCode = {
      daily: {
        time: ['2024-01-15'],
        temperature_2m_max: [10.0],
        temperature_2m_min: [5.0],
        precipitation_sum: [0],
        weathercode: [999] // Unknown code
      }
    };

    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(weatherResponseWithUnknownCode)
      } as Response);

    const result = await fetchWeatherData('Berlin', '2024-01-15');

    expect(result.weather_description).toBe('Unknown weather');

    mockFetch.mockRestore();
  });

  it('should throw error when city is not found', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyGeocodingResponse)
      } as Response);

    await expect(fetchWeatherData('NonexistentCity', '2024-01-15'))
      .rejects
      .toThrow(/city not found/i);

    mockFetch.mockRestore();
  });

  it('should throw error when geocoding API fails', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

    await expect(fetchWeatherData('Berlin', '2024-01-15'))
      .rejects
      .toThrow(/geocoding api error: 500/i);

    mockFetch.mockRestore();
  });

  it('should throw error when weather API fails', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503
      } as Response);

    await expect(fetchWeatherData('Berlin', '2024-01-15'))
      .rejects
      .toThrow(/weather api error: 503/i);

    mockFetch.mockRestore();
  });

  it('should throw error when no weather data is available', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyWeatherResponse)
      } as Response);

    await expect(fetchWeatherData('Berlin', '2024-01-15'))
      .rejects
      .toThrow(/no weather data available/i);

    mockFetch.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    const mockFetch = spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchWeatherData('Berlin', '2024-01-15'))
      .rejects
      .toThrow(/network error/i);

    mockFetch.mockRestore();
  });

  it('should round temperature to one decimal place', async () => {
    const weatherResponseWithPreciseTemps = {
      daily: {
        time: ['2024-01-15'],
        temperature_2m_max: [15.333333],
        temperature_2m_min: [8.666667], // Average should be 12.0
        precipitation_sum: [0],
        weathercode: [1]
      }
    };

    const mockFetch = spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(weatherResponseWithPreciseTemps)
      } as Response);

    const result = await fetchWeatherData('Berlin', '2024-01-15');

    expect(result.temperature).toBe(12.0); // Should be rounded to 1 decimal place
    expect(typeof result.temperature).toBe('number');

    mockFetch.mockRestore();
  });
});
