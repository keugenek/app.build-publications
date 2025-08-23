import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput } from '../schema';
import { createWellnessEntry } from '../handlers/create_wellness_entry';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateWellnessEntryInput = {
  date: new Date('2023-01-15'),
  sleep_hours: 7.5,
  stress_level: 3,
  caffeine_intake: 1.5,
  alcohol_intake: 0
};

describe('createWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wellness entry', async () => {
    const result = await createWellnessEntry(testInput);

    // Basic field validation
    // Dates are converted to YYYY-MM-DD format in the database, so we compare the date part only
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-01-15');
    expect(result.sleep_hours).toEqual(testInput.sleep_hours);
    expect(result.stress_level).toEqual(testInput.stress_level);
    expect(result.caffeine_intake).toEqual(testInput.caffeine_intake);
    expect(result.alcohol_intake).toEqual(testInput.alcohol_intake);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Wellness score should be calculated correctly
    expect(typeof result.wellness_score).toBe('number');
    expect(result.wellness_score).toBeGreaterThan(0);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should save wellness entry to database', async () => {
    const result = await createWellnessEntry(testInput);

    // Query using proper drizzle syntax
    const wellnessEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(wellnessEntries).toHaveLength(1);
    expect(wellnessEntries[0].date).toEqual('2023-01-15');
    expect(parseFloat(wellnessEntries[0].sleep_hours)).toEqual(testInput.sleep_hours);
    expect(wellnessEntries[0].stress_level).toEqual(testInput.stress_level);
    expect(parseFloat(wellnessEntries[0].caffeine_intake)).toEqual(testInput.caffeine_intake);
    expect(parseFloat(wellnessEntries[0].alcohol_intake)).toEqual(testInput.alcohol_intake);
    expect(wellnessEntries[0].created_at).toBeInstanceOf(Date);
    expect(wellnessEntries[0].updated_at).toBeInstanceOf(Date);
    
    // Check wellness score was calculated and stored correctly
    expect(parseFloat(wellnessEntries[0].wellness_score)).toBeGreaterThan(0);
  });

  it('should calculate wellness score correctly', async () => {
    const result = await createWellnessEntry(testInput);

    // Manually calculate expected wellness score
    // Base: 50
    // Sleep: (7.5 - 6) * 5 = 7.5
    // Stress: 3 <= 5, so 0
    // Caffeine: 1.5 <= 2, so 0
    // Alcohol: 0, so 0
    // Total: 50 + 7.5 = 57.5
    const expectedScore = 57.5;
    
    expect(result.wellness_score).toEqual(expectedScore);
  });

  it('should handle edge cases in wellness score calculation', async () => {
    // Test with inputs that should result in minimum score (0)
    const minScoreInput: CreateWellnessEntryInput = {
      date: new Date('2023-01-16'),
      sleep_hours: 0,
      stress_level: 10,
      caffeine_intake: 10,
      alcohol_intake: 10
    };

    const result = await createWellnessEntry(minScoreInput);
    
    // Score calculation:
    // Base: 50
    // Sleep: (0 - 6) * 5 = -30
    // Stress: (10 - 5) * 2 = -10
    // Caffeine: (10 - 2) * 1 = -8
    // Alcohol: 10 * 3 = -30
    // Total: 50 - 30 - 10 - 8 - 30 = -28, but clamped to 0
    expect(result.wellness_score).toBe(0);
  });
});
