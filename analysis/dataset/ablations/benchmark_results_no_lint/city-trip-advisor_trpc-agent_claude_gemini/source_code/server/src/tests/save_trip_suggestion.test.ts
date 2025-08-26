import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type TripSuggestionResponse } from '../schema';
import { saveTripSuggestion } from '../handlers/save_trip_suggestion';
import { eq } from 'drizzle-orm';

// Test input for good weather trip
const goodWeatherTrip: TripSuggestionResponse = {
  city: 'San Francisco',
  isGoodIdea: true,
  message: 'Great weather for exploring the city!',
  weather: {
    temperature: 22.5,
    precipitation: 0.0,
    weather_description: 'Clear skies'
  }
};

// Test input for bad weather trip
const badWeatherTrip: TripSuggestionResponse = {
  city: 'Seattle',
  isGoodIdea: false,
  message: 'Heavy rain expected - consider indoor activities',
  weather: {
    temperature: 15.8,
    precipitation: 12.3,
    weather_description: 'Heavy rain'
  }
};

describe('saveTripSuggestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a good weather trip suggestion', async () => {
    await saveTripSuggestion(goodWeatherTrip);

    // Query the database to verify the record was saved
    const suggestions = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'San Francisco'))
      .execute();

    expect(suggestions).toHaveLength(1);
    
    const saved = suggestions[0];
    expect(saved.city).toEqual('San Francisco');
    expect(saved.is_good_idea).toEqual(true);
    expect(saved.message).toEqual('Great weather for exploring the city!');
    expect(parseFloat(saved.temperature)).toEqual(22.5);
    expect(parseFloat(saved.precipitation)).toEqual(0.0);
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.id).toBeDefined();
  });

  it('should save a bad weather trip suggestion', async () => {
    await saveTripSuggestion(badWeatherTrip);

    // Query the database to verify the record was saved
    const suggestions = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'Seattle'))
      .execute();

    expect(suggestions).toHaveLength(1);
    
    const saved = suggestions[0];
    expect(saved.city).toEqual('Seattle');
    expect(saved.is_good_idea).toEqual(false);
    expect(saved.message).toEqual('Heavy rain expected - consider indoor activities');
    expect(parseFloat(saved.temperature)).toEqual(15.8);
    expect(parseFloat(saved.precipitation)).toEqual(12.3);
    expect(saved.created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric values with precision correctly', async () => {
    const preciseTrip: TripSuggestionResponse = {
      city: 'Denver',
      isGoodIdea: true,
      message: 'Perfect mountain weather',
      weather: {
        temperature: 18.75,
        precipitation: 2.25,
        weather_description: 'Partly cloudy'
      }
    };

    await saveTripSuggestion(preciseTrip);

    // Verify precise numeric values are stored and retrieved correctly
    const suggestions = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'Denver'))
      .execute();

    expect(suggestions).toHaveLength(1);
    
    const saved = suggestions[0];
    expect(parseFloat(saved.temperature)).toEqual(18.75);
    expect(parseFloat(saved.precipitation)).toEqual(2.25);
    expect(typeof parseFloat(saved.temperature)).toBe('number');
    expect(typeof parseFloat(saved.precipitation)).toBe('number');
  });

  it('should save multiple trip suggestions correctly', async () => {
    // Save multiple suggestions
    await saveTripSuggestion(goodWeatherTrip);
    await saveTripSuggestion(badWeatherTrip);

    // Verify both were saved
    const allSuggestions = await db.select()
      .from(tripSuggestionsTable)
      .execute();

    expect(allSuggestions).toHaveLength(2);
    
    // Verify we have both cities
    const cities = allSuggestions.map(s => s.city).sort();
    expect(cities).toEqual(['San Francisco', 'Seattle']);
    
    // Verify different is_good_idea values
    const decisions = allSuggestions.map(s => s.is_good_idea).sort();
    expect(decisions).toEqual([false, true]);
  });

  it('should handle zero precipitation correctly', async () => {
    const dryTrip: TripSuggestionResponse = {
      city: 'Phoenix',
      isGoodIdea: true,
      message: 'Perfect desert weather with no rain',
      weather: {
        temperature: 28.0,
        precipitation: 0.0,
        weather_description: 'Sunny and dry'
      }
    };

    await saveTripSuggestion(dryTrip);

    const suggestions = await db.select()
      .from(tripSuggestionsTable)
      .where(eq(tripSuggestionsTable.city, 'Phoenix'))
      .execute();

    expect(suggestions).toHaveLength(1);
    expect(parseFloat(suggestions[0].precipitation)).toEqual(0.0);
  });
});
