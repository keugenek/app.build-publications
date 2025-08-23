import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateWellnessEntryInput = {
  date: new Date('2023-06-15'),
  sleep_hours: 8,
  stress_level: 5,
  caffeine_intake: 2,
  alcohol_intake: 1
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry with correct calculations', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field validation
    expect(result.date).toEqual(testInput.date);
    expect(result.sleep_hours).toEqual(8);
    expect(result.stress_level).toEqual(5);
    expect(result.caffeine_intake).toEqual(2);
    expect(result.alcohol_intake).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify wellness score calculation
    // Sleep score: (8/24) * 10 = 3.33
    // Stress score: 11 - 5 = 6
    // Caffeine score: max(0, 10 - 2) = 8
    // Alcohol score: max(0, 10 - 1) = 9
    // Wellness score: (3.33 + 6 + 8 + 9) / 4 = 6.58
    expect(result.wellness_score).toBeCloseTo(6.58, 2);
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].date).toEqual('2023-06-15');
    expect(parseFloat(entries[0].sleep_hours)).toEqual(8);
    expect(entries[0].stress_level).toEqual(5);
    expect(entries[0].caffeine_intake).toEqual(2);
    expect(entries[0].alcohol_intake).toEqual(1);
    expect(parseFloat(entries[0].wellness_score)).toBeCloseTo(6.58, 2);
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle edge case with perfect wellness score', async () => {
    const perfectInput: CreateWellnessEntryInput = {
      date: new Date('2023-06-16'),
      sleep_hours: 24, // Maximum sleep
      stress_level: 1, // Minimum stress
      caffeine_intake: 0, // No caffeine
      alcohol_intake: 0  // No alcohol
    };

    const result = await createWellnessEntry(perfectInput);

    // With perfect inputs, wellness score should be 10
    expect(result.wellness_score).toBeCloseTo(10, 2);
  });

  it('should handle edge case with minimum wellness score', async () => {
    const poorInput: CreateWellnessEntryInput = {
      date: new Date('2023-06-17'),
      sleep_hours: 0, // No sleep
      stress_level: 10, // Maximum stress
      caffeine_intake: 20, // High caffeine
      alcohol_intake: 20  // High alcohol
    };

    const result = await createWellnessEntry(poorInput);

    // With poor inputs, wellness score should be 0.25
    // Sleep score: 0
    // Stress score: 1
    // Caffeine score: 0 (can't be negative)
    // Alcohol score: 0 (can't be negative)
    // Wellness score: (0 + 1 + 0 + 0) / 4 = 0.25
    expect(result.wellness_score).toBeCloseTo(0.25, 2);
  });

  it('should properly convert Date objects to date strings', async () => {
    const dateInput: CreateWellnessEntryInput = {
      date: new Date('2023-12-25T14:30:00Z'),
      sleep_hours: 7,
      stress_level: 3,
      caffeine_intake: 1,
      alcohol_intake: 0
    };

    const result = await createWellnessEntry(dateInput);

    // Date should be properly formatted as YYYY-MM-DD
    expect(result.date).toEqual(new Date('2023-12-25T00:00:00Z'));
  });

  it('should properly handle numeric conversions', async () => {
    const decimalInput: CreateWellnessEntryInput = {
      date: new Date('2023-06-18'),
      sleep_hours: 6.5, // Decimal hours
      stress_level: 7,
      caffeine_intake: 3,
      alcohol_intake: 2
    };

    const result = await createWellnessEntry(decimalInput);

    // Verify decimal values are handled correctly
    expect(result.sleep_hours).toEqual(6.5);
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.wellness_score).toBe('number');
  });
});
