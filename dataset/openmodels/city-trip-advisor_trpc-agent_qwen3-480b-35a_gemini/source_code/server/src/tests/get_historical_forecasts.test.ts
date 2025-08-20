import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable, weatherForecastsTable } from '../db/schema';
import { getHistoricalForecasts } from '../handlers/get_historical_forecasts';

describe('getHistoricalForecasts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test city
    const cities = await db.insert(citiesTable)
      .values({
        name: 'Test City',
        country: 'Test Country',
        latitude: '40.7128000', // Convert number to string for numeric column
        longitude: '-74.0060000'
      })
      .returning()
      .execute();
    
    const cityId = cities[0].id;
    
    // Create test weather forecasts
    await db.insert(weatherForecastsTable)
      .values([
        {
          city_id: cityId,
          date: new Date('2023-06-01'),
          temperature: '25.50', // Convert number to string for numeric column
          precipitation_probability: 30
        },
        {
          city_id: cityId,
          date: new Date('2023-06-02'),
          temperature: '27.00',
          precipitation_probability: 70
        },
        {
          city_id: cityId,
          date: new Date('2023-06-03'),
          temperature: '22.75',
          precipitation_probability: 20
        }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should return historical forecasts for an existing city', async () => {
    const result = await getHistoricalForecasts('Test City');
    
    expect(result).toHaveLength(3);
    
    // Check first forecast
    expect(result[0]).toEqual({
      city: 'Test City',
      date: '2023-06-01',
      temperature: 25.5,
      precipitation_probability: 30,
      is_good_idea: true
    });
    
    // Check second forecast
    expect(result[1]).toEqual({
      city: 'Test City',
      date: '2023-06-02',
      temperature: 27,
      precipitation_probability: 70,
      is_good_idea: false
    });
    
    // Check third forecast
    expect(result[2]).toEqual({
      city: 'Test City',
      date: '2023-06-03',
      temperature: 22.75,
      precipitation_probability: 20,
      is_good_idea: true
    });
  });

  it('should return empty array for non-existent city', async () => {
    const result = await getHistoricalForecasts('Non-existent City');
    
    expect(result).toEqual([]);
  });

  it('should return forecasts sorted by date', async () => {
    const result = await getHistoricalForecasts('Test City');
    
    // Should be sorted by date ascending
    expect(result[0].date).toBe('2023-06-01');
    expect(result[1].date).toBe('2023-06-02');
    expect(result[2].date).toBe('2023-06-03');
  });

  it('should correctly calculate is_good_idea based on precipitation probability', async () => {
    const result = await getHistoricalForecasts('Test City');
    
    // First forecast: 30% precipitation -> good idea
    expect(result[0].is_good_idea).toBe(true);
    
    // Second forecast: 70% precipitation -> not a good idea
    expect(result[1].is_good_idea).toBe(false);
    
    // Third forecast: 20% precipitation -> good idea
    expect(result[2].is_good_idea).toBe(true);
  });
});
