import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntryById } from '../handlers/get_wellness_entry_by_id';

describe('getWellnessEntryById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a wellness entry when found', async () => {
    // Create a test wellness entry
    const testEntry = {
      sleep_hours: '7.5',
      stress_level: 4,
      caffeine_intake: '200.0',
      alcohol_intake: '1.5',
      wellness_score: '85.25',
      entry_date: '2024-01-15'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(testEntry)
      .returning()
      .execute();

    const insertedEntry = insertResult[0];

    // Test the handler
    const result = await getWellnessEntryById(insertedEntry.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(insertedEntry.id);
    expect(result!.sleep_hours).toBe(7.5);
    expect(typeof result!.sleep_hours).toBe('number');
    expect(result!.stress_level).toBe(4);
    expect(result!.caffeine_intake).toBe(200.0);
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(result!.alcohol_intake).toBe(1.5);
    expect(typeof result!.alcohol_intake).toBe('number');
    expect(result!.wellness_score).toBe(85.25);
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.entry_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when entry not found', async () => {
    // Test with non-existent ID
    const result = await getWellnessEntryById(999999);
    
    expect(result).toBeNull();
  });

  it('should handle zero and negative IDs', async () => {
    // Test with zero ID
    const resultZero = await getWellnessEntryById(0);
    expect(resultZero).toBeNull();

    // Test with negative ID
    const resultNegative = await getWellnessEntryById(-1);
    expect(resultNegative).toBeNull();
  });

  it('should preserve all numeric precision from database', async () => {
    // Create entry with precise decimal values
    const preciseEntry = {
      sleep_hours: '8.75',
      stress_level: 7,
      caffeine_intake: '125.50',
      alcohol_intake: '2.25',
      wellness_score: '72.33',
      entry_date: '2024-02-01'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(preciseEntry)
      .returning()
      .execute();

    const result = await getWellnessEntryById(insertResult[0].id);

    // Verify precise decimal handling
    expect(result!.sleep_hours).toBe(8.75);
    expect(result!.caffeine_intake).toBe(125.5);
    expect(result!.alcohol_intake).toBe(2.25);
    expect(result!.wellness_score).toBe(72.33);
  });

  it('should handle entries with minimum values', async () => {
    // Create entry with minimum allowed values
    const minEntry = {
      sleep_hours: '0.0',
      stress_level: 1,
      caffeine_intake: '0.0',
      alcohol_intake: '0.0',
      wellness_score: '0.0',
      entry_date: '2024-01-01'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(minEntry)
      .returning()
      .execute();

    const result = await getWellnessEntryById(insertResult[0].id);

    // Verify minimum values are handled correctly
    expect(result!.sleep_hours).toBe(0);
    expect(result!.stress_level).toBe(1);
    expect(result!.caffeine_intake).toBe(0);
    expect(result!.alcohol_intake).toBe(0);
    expect(result!.wellness_score).toBe(0);
  });

  it('should handle entries with maximum stress level', async () => {
    // Create entry with maximum stress level
    const maxStressEntry = {
      sleep_hours: '9.0',
      stress_level: 10,
      caffeine_intake: '300.0',
      alcohol_intake: '3.0',
      wellness_score: '45.0',
      entry_date: '2024-03-15'
    };

    const insertResult = await db.insert(wellnessEntriesTable)
      .values(maxStressEntry)
      .returning()
      .execute();

    const result = await getWellnessEntryById(insertResult[0].id);

    // Verify maximum stress level is handled correctly
    expect(result!.stress_level).toBe(10);
    expect(result!.sleep_hours).toBe(9);
    expect(result!.caffeine_intake).toBe(300);
    expect(result!.alcohol_intake).toBe(3);
    expect(result!.wellness_score).toBe(45);
  });
});
