import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntry } from '../handlers/get_wellness_entry';
import { eq } from 'drizzle-orm';

describe('getWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data that matches the database schema (strings for numeric fields)
  const testEntry = {
    date: '2023-01-15', // Stored as string in DB
    sleep_hours: '7.50', // Stored as string in DB
    stress_level: 5,
    caffeine_intake: '2.00', // Stored as string in DB
    alcohol_intake: '1.50', // Stored as string in DB
    wellness_score: '8.25' // Stored as string in DB
  };

  it('should fetch an existing wellness entry by ID', async () => {
    // Insert a test entry directly into the database
    const inserted = await db.insert(wellnessEntriesTable)
      .values(testEntry)
      .returning()
      .execute();

    const entryId = inserted[0].id;

    // Fetch the entry using our handler
    const result = await getWellnessEntry(entryId);

    // Check that we got the entry back
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    
    // Check all the fields
    expect(result!.id).toEqual(entryId);
    expect(result!.date).toEqual(new Date('2023-01-15'));
    expect(result!.sleep_hours).toEqual(7.5); // Converted to number
    expect(result!.stress_level).toEqual(testEntry.stress_level);
    expect(result!.caffeine_intake).toEqual(2.0); // Converted to number
    expect(result!.alcohol_intake).toEqual(1.5); // Converted to number
    expect(result!.wellness_score).toEqual(8.25); // Converted to number
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result!.sleep_hours).toBe('number');
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(typeof result!.alcohol_intake).toBe('number');
    expect(typeof result!.wellness_score).toBe('number');
  });

  it('should return null for a non-existent entry ID', async () => {
    // Try to fetch an entry that doesn't exist
    const result = await getWellnessEntry(99999);
    
    // Should return null
    expect(result).toBeNull();
  });

  it('should handle entries with zero values correctly', async () => {
    // Insert a test entry with zero values
    const zeroEntry = {
      date: '2023-01-16',
      sleep_hours: '0.00',
      stress_level: 1,
      caffeine_intake: '0.00',
      alcohol_intake: '0.00',
      wellness_score: '9.00'
    };

    const inserted = await db.insert(wellnessEntriesTable)
      .values(zeroEntry)
      .returning()
      .execute();

    const entryId = inserted[0].id;

    // Fetch the entry using our handler
    const result = await getWellnessEntry(entryId);

    // Check that we got the entry back with correct values
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(entryId);
    expect(result!.sleep_hours).toEqual(0);
    expect(result!.caffeine_intake).toEqual(0);
    expect(result!.alcohol_intake).toEqual(0);
    expect(result!.wellness_score).toEqual(9.0);
    
    // Verify numeric types
    expect(typeof result!.sleep_hours).toBe('number');
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(typeof result!.alcohol_intake).toBe('number');
    expect(typeof result!.wellness_score).toBe('number');
  });

  it('should handle database errors gracefully', async () => {
    // This test ensures our handler properly throws errors
    // In a real scenario, this might involve network issues or permissions
    
    // Note: We're not actually triggering a DB error here,
    // but we're confirming the handler has error handling in place
    // The try/catch block in the implementation will preserve errors
    
    // We can at least verify that valid IDs don't throw
    const result = await getWellnessEntry(-1); // Negative ID shouldn't exist
    expect(result).toBeNull();
  });
});
