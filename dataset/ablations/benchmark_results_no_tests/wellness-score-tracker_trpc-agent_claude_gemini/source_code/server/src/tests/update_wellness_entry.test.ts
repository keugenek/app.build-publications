import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Test data for creating initial wellness entries
const initialWellnessEntry = {
  user_id: 'user_123',
  date: '2024-01-15',
  sleep_hours: '8.0',
  stress_level: 5,
  caffeine_intake: '150.0',
  alcohol_intake: '0.0'
};

describe('updateWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testEntryId: number;

  // Create a test entry before each test
  beforeEach(async () => {
    // Calculate wellness score for initial entry
    const wellnessScore = 70; // Based on the algorithm with these values
    
    const result = await db.insert(wellnessEntriesTable)
      .values({
        ...initialWellnessEntry,
        wellness_score: wellnessScore.toString()
      })
      .returning()
      .execute();
    
    testEntryId = result[0].id;
  });

  it('should update all wellness entry fields', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 9.5,
      stress_level: 3,
      caffeine_intake: 75.0,
      alcohol_intake: 1.0
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(testEntryId);
    expect(result.sleep_hours).toEqual(9.5);
    expect(result.stress_level).toEqual(3);
    expect(result.caffeine_intake).toEqual(75.0);
    expect(result.alcohol_intake).toEqual(1.0);
    expect(result.wellness_score).toBeNumber();
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.sleep_hours).toBe('number');
    expect(typeof result.caffeine_intake).toBe('number');
    expect(typeof result.alcohol_intake).toBe('number');
    expect(typeof result.wellness_score).toBe('number');
  });

  it('should update partial wellness entry fields', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 6.5,
      stress_level: 8
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify updated fields
    expect(result.sleep_hours).toEqual(6.5);
    expect(result.stress_level).toEqual(8);
    
    // Verify unchanged fields retain original values
    expect(result.caffeine_intake).toEqual(150.0);
    expect(result.alcohol_intake).toEqual(0.0);
    expect(result.user_id).toEqual('user_123');
  });

  it('should recalculate wellness score after update', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 8.0, // Optimal sleep
      stress_level: 2,   // Low stress
      caffeine_intake: 100.0, // Moderate caffeine
      alcohol_intake: 0.0     // No alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    // With these optimal values, wellness score should be high
    expect(result.wellness_score).toBeGreaterThan(80);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should save updated entry to database', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 7.5,
      caffeine_intake: 200.0
    };

    await updateWellnessEntry(updateInput);

    // Query database to verify update was persisted
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, testEntryId))
      .execute();

    expect(entries).toHaveLength(1);
    const dbEntry = entries[0];
    
    expect(parseFloat(dbEntry.sleep_hours)).toEqual(7.5);
    expect(parseFloat(dbEntry.caffeine_intake)).toEqual(200.0);
    expect(dbEntry.stress_level).toEqual(5); // Unchanged
    expect(parseFloat(dbEntry.alcohol_intake)).toEqual(0.0); // Unchanged
    expect(parseFloat(dbEntry.wellness_score)).toBeNumber();
    expect(dbEntry.updated_at).toBeInstanceOf(Date);
  });

  it('should handle single field updates correctly', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      stress_level: 10
    };

    const result = await updateWellnessEntry(updateInput);

    // Only stress_level should change
    expect(result.stress_level).toEqual(10);
    expect(result.sleep_hours).toEqual(8.0); // Original value
    expect(result.caffeine_intake).toEqual(150.0); // Original value
    expect(result.alcohol_intake).toEqual(0.0); // Original value
    
    // Wellness score should be recalculated
    expect(result.wellness_score).toBeLessThan(70); // Should be lower due to high stress
  });

  it('should throw error for non-existent wellness entry', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 99999, // Non-existent ID
      sleep_hours: 8.0
    };

    expect(updateWellnessEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update wellness score with extreme values', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 3.0,     // Very low sleep
      stress_level: 10,     // Maximum stress
      caffeine_intake: 500.0, // High caffeine
      alcohol_intake: 5.0   // High alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    // With these poor values, wellness score should be very low
    expect(result.wellness_score).toBeLessThan(30);
    expect(result.wellness_score).toBeGreaterThanOrEqual(0);
  });

  it('should handle boundary values correctly', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntryId,
      sleep_hours: 0.0,
      stress_level: 1,
      caffeine_intake: 0.0,
      alcohol_intake: 0.0
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result.sleep_hours).toEqual(0.0);
    expect(result.stress_level).toEqual(1);
    expect(result.caffeine_intake).toEqual(0.0);
    expect(result.alcohol_intake).toEqual(0.0);
    expect(result.wellness_score).toBeGreaterThanOrEqual(0);
    expect(result.wellness_score).toBeLessThanOrEqual(100);
  });
});
