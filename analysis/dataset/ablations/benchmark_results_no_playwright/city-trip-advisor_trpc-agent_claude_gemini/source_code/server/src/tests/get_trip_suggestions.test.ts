import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type GetTripSuggestionsInput } from '../schema';
import { getTripSuggestions } from '../handlers/get_trip_suggestions';

// Test data
const testSuggestions = [
  {
    city: 'Paris',
    suggestion: 'Yes' as const,
    temperature_min: '18.50',
    temperature_max: '25.30',
    precipitation: '0.20',
    forecast_date: new Date('2024-01-15'),
    reasoning: 'Perfect weather conditions for sightseeing',
    created_at: new Date('2024-01-10T10:00:00Z')
  },
  {
    city: 'London',
    suggestion: 'No' as const,
    temperature_min: '5.80',
    temperature_max: '12.40',
    precipitation: '15.50',
    forecast_date: new Date('2024-01-16'),
    reasoning: 'High precipitation and cold temperatures',
    created_at: new Date('2024-01-09T09:00:00Z')
  },
  {
    city: 'Paris',
    suggestion: 'No' as const,
    temperature_min: '2.10',
    temperature_max: '8.90',
    precipitation: '25.80',
    forecast_date: new Date('2024-01-17'),
    reasoning: 'Heavy rain and cold weather expected',
    created_at: new Date('2024-01-08T08:00:00Z')
  }
];

describe('getTripSuggestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no suggestions exist', async () => {
    const input: GetTripSuggestionsInput = {
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toEqual([]);
  });

  it('should return all suggestions ordered by created_at desc', async () => {
    // Insert test data
    await db.insert(tripSuggestionsTable).values(testSuggestions).execute();

    const input: GetTripSuggestionsInput = {
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering (most recent first)
    expect(result[0].city).toEqual('Paris');
    expect(result[0].suggestion).toEqual('Yes');
    expect(result[0].created_at).toEqual(new Date('2024-01-10T10:00:00Z'));
    
    expect(result[1].city).toEqual('London');
    expect(result[1].suggestion).toEqual('No');
    
    expect(result[2].city).toEqual('Paris');
    expect(result[2].suggestion).toEqual('No');
  });

  it('should convert numeric fields correctly', async () => {
    // Insert single test record
    await db.insert(tripSuggestionsTable).values([testSuggestions[0]]).execute();

    const input: GetTripSuggestionsInput = {
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toHaveLength(1);
    
    // Verify numeric conversions
    expect(typeof result[0].temperature_min).toBe('number');
    expect(result[0].temperature_min).toEqual(18.5);
    
    expect(typeof result[0].temperature_max).toBe('number');
    expect(result[0].temperature_max).toEqual(25.3);
    
    expect(typeof result[0].precipitation).toBe('number');
    expect(result[0].precipitation).toEqual(0.2);
  });

  it('should filter by city when provided', async () => {
    // Insert test data
    await db.insert(tripSuggestionsTable).values(testSuggestions).execute();

    const input: GetTripSuggestionsInput = {
      city: 'Paris',
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toHaveLength(2);
    result.forEach(suggestion => {
      expect(suggestion.city).toEqual('Paris');
    });

    // Verify ordering within filtered results
    expect(result[0].suggestion).toEqual('Yes'); // More recent Paris suggestion
    expect(result[1].suggestion).toEqual('No'); // Older Paris suggestion
  });

  it('should respect limit parameter', async () => {
    // Insert test data
    await db.insert(tripSuggestionsTable).values(testSuggestions).execute();

    const input: GetTripSuggestionsInput = {
      limit: 2
    };

    const result = await getTripSuggestions(input);

    expect(result).toHaveLength(2);
    
    // Should return the 2 most recent
    expect(result[0].city).toEqual('Paris');
    expect(result[0].suggestion).toEqual('Yes');
    expect(result[1].city).toEqual('London');
  });

  it('should limit results correctly with various limits', async () => {
    // Create more than 10 records to test limit behavior
    const manyRecords = Array.from({ length: 15 }, (_, i) => ({
      city: `City${i}`,
      suggestion: 'Yes' as const,
      temperature_min: '20.00',
      temperature_max: '25.00',
      precipitation: '0.00',
      forecast_date: new Date(),
      reasoning: `Test suggestion ${i}`,
      created_at: new Date(Date.now() - i * 1000) // Different timestamps
    }));

    await db.insert(tripSuggestionsTable).values(manyRecords).execute();

    // Test with limit of 5
    const result5 = await getTripSuggestions({ limit: 5 });
    expect(result5).toHaveLength(5);

    // Test with limit of 10
    const result10 = await getTripSuggestions({ limit: 10 });
    expect(result10).toHaveLength(10);

    // Test with limit larger than available records
    const result20 = await getTripSuggestions({ limit: 20 });
    expect(result20).toHaveLength(15); // Should return all available records
  });

  it('should handle city filter with no matches', async () => {
    // Insert test data
    await db.insert(tripSuggestionsTable).values(testSuggestions).execute();

    const input: GetTripSuggestionsInput = {
      city: 'Tokyo', // City not in test data
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toEqual([]);
  });

  it('should return all required fields correctly', async () => {
    // Insert single test record
    await db.insert(tripSuggestionsTable).values([testSuggestions[0]]).execute();

    const input: GetTripSuggestionsInput = {
      limit: 10
    };

    const result = await getTripSuggestions(input);

    expect(result).toHaveLength(1);
    
    const suggestion = result[0];
    
    // Verify all fields are present and correct type
    expect(typeof suggestion.id).toBe('number');
    expect(typeof suggestion.city).toBe('string');
    expect(['Yes', 'No']).toContain(suggestion.suggestion);
    expect(typeof suggestion.temperature_min).toBe('number');
    expect(typeof suggestion.temperature_max).toBe('number');
    expect(typeof suggestion.precipitation).toBe('number');
    expect(suggestion.forecast_date).toBeInstanceOf(Date);
    expect(typeof suggestion.reasoning).toBe('string');
    expect(suggestion.created_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(suggestion.city).toEqual('Paris');
    expect(suggestion.suggestion).toEqual('Yes');
    expect(suggestion.reasoning).toEqual('Perfect weather conditions for sightseeing');
    expect(suggestion.forecast_date).toEqual(new Date('2024-01-15'));
  });
});
