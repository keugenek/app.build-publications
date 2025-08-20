import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type TripSuggestionInput } from '../schema';
import { getTripSuggestion } from '../handlers/get_trip_suggestion';
import { eq } from 'drizzle-orm';

// Test inputs for different scenarios
const testInputs = {
  normalCity: { city: 'Paris' },
  coldCity: { city: 'Reykjavik' }, // Should generate cold weather
  rainyCity: { city: 'Seattle' }, // Should generate rainy weather
  emptyCity: { city: '' }
};

describe('getTripSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a trip suggestion with all required fields', async () => {
    const result = await getTripSuggestion(testInputs.normalCity);

    // Verify response structure
    expect(result).toHaveProperty('isGoodIdea');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('weather');
    
    // Verify types
    expect(typeof result.isGoodIdea).toBe('boolean');
    expect(typeof result.message).toBe('string');
    expect(typeof result.city).toBe('string');
    expect(typeof result.weather).toBe('object');
    
    // Verify weather object structure
    expect(result.weather).toHaveProperty('temperature');
    expect(result.weather).toHaveProperty('precipitation');
    expect(result.weather).toHaveProperty('weather_description');
    expect(typeof result.weather.temperature).toBe('number');
    expect(typeof result.weather.precipitation).toBe('number');
    expect(typeof result.weather.weather_description).toBe('string');
    
    // Verify city matches input
    expect(result.city).toBe('Paris');
  });

  it('should save suggestion to database', async () => {
    const result = await getTripSuggestion(testInputs.normalCity);

    // Give some time for async save operation (fire and forget)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Query database to verify save
    const saved = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'Paris'))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].city).toBe('Paris');
    expect(saved[0].is_good_idea).toBe(result.isGoodIdea);
    expect(saved[0].message).toBe(result.message);
    expect(parseFloat(saved[0].temperature)).toBe(result.weather.temperature);
    expect(parseFloat(saved[0].precipitation)).toBe(result.weather.precipitation);
    expect(saved[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different cities with consistent results', async () => {
    const result1 = await getTripSuggestion(testInputs.normalCity);
    const result2 = await getTripSuggestion(testInputs.normalCity);

    // Same city should produce same weather (deterministic mock)
    expect(result1.weather.temperature).toBe(result2.weather.temperature);
    expect(result1.weather.precipitation).toBe(result2.weather.precipitation);
    expect(result1.weather.weather_description).toBe(result2.weather.weather_description);
    expect(result1.isGoodIdea).toBe(result2.isGoodIdea);
  });

  it('should generate different weather for different cities', async () => {
    const parisResult = await getTripSuggestion({ city: 'Paris' });
    const londonResult = await getTripSuggestion({ city: 'London' });

    // Different cities should produce different weather
    expect(parisResult.weather.temperature).not.toBe(londonResult.weather.temperature);
    expect(parisResult.city).toBe('Paris');
    expect(londonResult.city).toBe('London');
  });

  it('should evaluate trip suggestions based on weather conditions', async () => {
    // Test multiple cities to get different weather conditions
    const cities = ['TestColdCity', 'TestWarmCity', 'TestRainyCity', 'TestSunnyCity'];
    const results = await Promise.all(cities.map(city => getTripSuggestion({ city })));

    // Verify each result has proper evaluation logic
    results.forEach(result => {
      expect(typeof result.isGoodIdea).toBe('boolean');
      expect(result.message).toContain(result.city);
      expect(result.message.length).toBeGreaterThan(0);
      
      // Cold weather should have appropriate messaging
      if (result.weather.temperature < 5) {
        expect(result.isGoodIdea).toBe(false);
        expect(result.message).toMatch(/cold|temperature/i);
      }
      
      // Heavy rain should have appropriate messaging
      if (result.weather.precipitation > 5) {
        expect(result.isGoodIdea).toBe(false);
        expect(result.message).toMatch(/rain|weather/i);
      }
    });
  });

  it('should handle empty city name gracefully', async () => {
    const result = await getTripSuggestion({ city: '' });

    // Should still return valid response structure
    expect(result).toHaveProperty('isGoodIdea');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('weather');
    expect(result.city).toBe('');
  });

  it('should save multiple suggestions to database', async () => {
    const cities = ['Paris', 'London', 'Tokyo'];
    
    // Create multiple suggestions
    await Promise.all(cities.map(city => getTripSuggestion({ city })));
    
    // Give time for async saves
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify all were saved
    const allSuggestions = await db.select()
      .from(tripSuggestionsTable)
      .execute();

    expect(allSuggestions.length).toBeGreaterThanOrEqual(3);
    
    // Verify each city was saved
    cities.forEach(city => {
      const citySuggestion = allSuggestions.find(s => s.city === city);
      expect(citySuggestion).toBeDefined();
      expect(citySuggestion?.created_at).toBeInstanceOf(Date);
    });
  });

  it('should have consistent weather evaluation logic', async () => {
    const testCases = [
      { city: 'WarmCity', expectedTemp: 25 }, // Should be good weather
      { city: 'ColdCity', expectedTemp: -5 }  // Should be bad weather
    ];

    for (const testCase of testCases) {
      const result = await getTripSuggestion({ city: testCase.city });
      
      // Weather should be within reasonable ranges
      expect(result.weather.temperature).toBeGreaterThanOrEqual(-20);
      expect(result.weather.temperature).toBeLessThanOrEqual(50);
      expect(result.weather.precipitation).toBeGreaterThanOrEqual(0);
      expect(result.weather.precipitation).toBeLessThanOrEqual(20);
      expect(result.weather.weather_description.length).toBeGreaterThan(0);
    }
  });
});
