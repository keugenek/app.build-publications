import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getCityWeather } from '../handlers/get_city_weather';
import { type CityWeatherInput } from '../schema';

const sunnyCity: CityWeatherInput = { city: 'Sunnyville' };
const rainyCity: CityWeatherInput = { city: 'RainyTown' };

describe('getCityWeather', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return good suggestion for city without "rain" in name', async () => {
    const result = await getCityWeather(sunnyCity);
    expect(result.suggestion).toBe('good');
    expect(result.description).toBe('Sunny');
    expect(result.precipitation_probability).toBe(10);
    expect(result.min_temperature).toBeGreaterThanOrEqual(10);
    expect(result.max_temperature).toBeGreaterThanOrEqual(20);
  });

  it('should return bad suggestion for city containing "rain"', async () => {
    const result = await getCityWeather(rainyCity);
    expect(result.suggestion).toBe('bad');
    expect(result.description).toBe('Rainy');
    expect(result.precipitation_probability).toBe(60);
  });
});
