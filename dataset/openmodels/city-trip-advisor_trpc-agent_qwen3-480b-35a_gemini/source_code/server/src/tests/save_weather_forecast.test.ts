import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable, weatherForecastsTable } from '../db/schema';
import { type WeatherForecast } from '../schema';
import { saveWeatherForecast } from '../handlers/save_weather_forecast';
import { eq } from 'drizzle-orm';

// Test forecast data
const testForecast: WeatherForecast = {
  city: 'Test City',
  date: '2023-06-15',
  temperature: 25.5,
  precipitation_probability: 30,
  is_good_idea: true
};

describe('saveWeatherForecast', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a new weather forecast and create a new city', async () => {
    // Verify no cities exist initially
    let cities = await db.select().from(citiesTable).execute();
    expect(cities).toHaveLength(0);

    // Save the forecast
    await saveWeatherForecast(testForecast);

    // Check that the city was created
    cities = await db.select().from(citiesTable).execute();
    expect(cities).toHaveLength(1);
    expect(cities[0].name).toEqual('Test City');
    expect(cities[0].country).toEqual('Unknown');

    // Check that the forecast was saved
    const forecasts = await db.select().from(weatherForecastsTable).execute();
    expect(forecasts).toHaveLength(1);
    expect(parseFloat(forecasts[0].temperature)).toEqual(25.5);
    expect(forecasts[0].precipitation_probability).toEqual(30);
    expect(forecasts[0].date).toBeInstanceOf(Date);
  });

  it('should save a forecast for an existing city', async () => {
    // First, create a city
    const cityResult = await db.insert(citiesTable)
      .values({
        name: 'Test City',
        country: 'Test Country',
        latitude: '1.2345678',
        longitude: '2.3456789'
      })
      .returning({ id: citiesTable.id })
      .execute();

    const cityId = cityResult[0].id;

    // Save the forecast
    await saveWeatherForecast(testForecast);

    // Check that no additional city was created
    const cities = await db.select().from(citiesTable).execute();
    expect(cities).toHaveLength(1);
    expect(cities[0].id).toEqual(cityId);

    // Check that the forecast was saved
    const forecasts = await db.select().from(weatherForecastsTable).execute();
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0].city_id).toEqual(cityId);
    expect(parseFloat(forecasts[0].temperature)).toEqual(25.5);
  });

  it('should handle multiple forecasts for the same city', async () => {
    // Save first forecast
    await saveWeatherForecast(testForecast);

    // Save second forecast with different data
    const secondForecast: WeatherForecast = {
      city: 'Test City',
      date: '2023-06-16',
      temperature: 27.3,
      precipitation_probability: 15,
      is_good_idea: true
    };

    await saveWeatherForecast(secondForecast);

    // Check that only one city exists
    const cities = await db.select().from(citiesTable).execute();
    expect(cities).toHaveLength(1);

    // Check that both forecasts were saved
    const forecasts = await db.select().from(weatherForecastsTable).execute();
    expect(forecasts).toHaveLength(2);

    // Verify the temperatures are correct
    const temps = forecasts.map(f => parseFloat(f.temperature)).sort();
    expect(temps).toEqual([25.5, 27.3]);
  });

  it('should save numeric values correctly', async () => {
    await saveWeatherForecast(testForecast);

    const forecasts = await db.select().from(weatherForecastsTable).execute();
    const forecast = forecasts[0];

    // Check that numeric values are stored correctly
    expect(typeof forecast.temperature).toBe('string'); // PostgreSQL numeric stored as string in Drizzle
    expect(parseFloat(forecast.temperature)).toBe(25.5);
    expect(typeof forecast.precipitation_probability).toBe('number');
    expect(forecast.precipitation_probability).toBe(30);
  });
});
