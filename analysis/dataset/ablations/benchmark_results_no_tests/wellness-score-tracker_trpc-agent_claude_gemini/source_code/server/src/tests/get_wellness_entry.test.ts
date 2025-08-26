import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type GetWellnessEntryInput } from '../schema';
import { getWellnessEntry } from '../handlers/get_wellness_entry';

// Test wellness entry data
const testWellnessEntry = {
  user_id: 'test_user_123',
  date: '2024-01-15',
  sleep_hours: '7.50', // stored as string in numeric column
  stress_level: 6,
  caffeine_intake: '200.00', // stored as string in numeric column
  alcohol_intake: '1.50', // stored as string in numeric column  
  wellness_score: '82.75' // stored as string in numeric column
};

describe('getWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing wellness entry', async () => {
    // Create test entry
    const insertResult = await db.insert(wellnessEntriesTable)
      .values(testWellnessEntry)
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    const input: GetWellnessEntryInput = { id: createdEntry.id };

    // Retrieve the entry
    const result = await getWellnessEntry(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEntry.id);
    expect(result!.user_id).toEqual('test_user_123');
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.sleep_hours).toEqual(7.5);
    expect(typeof result!.sleep_hours).toBe('number');
    expect(result!.stress_level).toEqual(6);
    expect(result!.caffeine_intake).toEqual(200);
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(result!.alcohol_intake).toEqual(1.5);
    expect(typeof result!.alcohol_intake).toBe('number');
    expect(result!.wellness_score).toEqual(82.75);
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent wellness entry', async () => {
    const input: GetWellnessEntryInput = { id: 999999 };

    const result = await getWellnessEntry(input);

    expect(result).toBeNull();
  });

  it('should handle zero values correctly', async () => {
    // Create entry with zero values
    const zeroValuesEntry = {
      user_id: 'test_user_zero',
      date: '2024-01-16',
      sleep_hours: '0.00',
      stress_level: 1, // minimum stress level
      caffeine_intake: '0.00',
      alcohol_intake: '0.00',
      wellness_score: '0.00'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(zeroValuesEntry)
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    const input: GetWellnessEntryInput = { id: createdEntry.id };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(0);
    expect(result!.stress_level).toEqual(1);
    expect(result!.caffeine_intake).toEqual(0);
    expect(result!.alcohol_intake).toEqual(0);
    expect(result!.wellness_score).toEqual(0);
  });

  it('should handle maximum values correctly', async () => {
    // Create entry with maximum/high values
    const maxValuesEntry = {
      user_id: 'test_user_max',
      date: '2024-01-17',
      sleep_hours: '24.00', // maximum sleep hours
      stress_level: 10, // maximum stress level
      caffeine_intake: '1000.50',
      alcohol_intake: '10.75',
      wellness_score: '100.00'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(maxValuesEntry)
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    const input: GetWellnessEntryInput = { id: createdEntry.id };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(24);
    expect(result!.stress_level).toEqual(10);
    expect(result!.caffeine_intake).toEqual(1000.5);
    expect(result!.alcohol_intake).toEqual(10.75);
    expect(result!.wellness_score).toEqual(100);
  });

  it('should preserve decimal precision in numeric fields', async () => {
    // Test with precise decimal values
    const precisionEntry = {
      user_id: 'test_user_precision',
      date: '2024-01-18',
      sleep_hours: '7.25',
      stress_level: 7,
      caffeine_intake: '150.75',
      alcohol_intake: '2.33',
      wellness_score: '73.89'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(precisionEntry)
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    const input: GetWellnessEntryInput = { id: createdEntry.id };

    const result = await getWellnessEntry(input);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(7.25);
    expect(result!.caffeine_intake).toEqual(150.75);
    expect(result!.alcohol_intake).toEqual(2.33);
    expect(result!.wellness_score).toEqual(73.89);
  });
});
