import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Create a test wellness entry in the database
const createTestWellnessEntry = async () => {
  const result = await db.insert(wellnessEntriesTable)
    .values({
      user_id: 'test-user-123',
      date: '2024-01-15',
      sleep_hours: '8.0',
      stress_level: 5,
      caffeine_intake: 150,
      alcohol_intake: 1,
      wellness_score: '75.0'
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a single field and recalculate wellness score', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 9.0 // Only update sleep hours
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testEntry.id);
    expect(result!.sleep_hours).toEqual(9.0);
    expect(result!.stress_level).toEqual(5); // Should remain unchanged
    expect(result!.caffeine_intake).toEqual(150); // Should remain unchanged
    expect(result!.alcohol_intake).toEqual(1); // Should remain unchanged
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.wellness_score).not.toEqual(75.0); // Should be recalculated
    expect(result!.user_id).toEqual('test-user-123');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields and recalculate wellness score', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 7.5,
      stress_level: 3,
      caffeine_intake: 100
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(7.5);
    expect(result!.stress_level).toEqual(3);
    expect(result!.caffeine_intake).toEqual(100);
    expect(result!.alcohol_intake).toEqual(1); // Should remain unchanged
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.wellness_score).toBeGreaterThan(75.0); // Should improve with better values
  });

  it('should update all fields and recalculate wellness score', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 8.0,
      stress_level: 2,
      caffeine_intake: 50,
      alcohol_intake: 0
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(8.0);
    expect(result!.stress_level).toEqual(2);
    expect(result!.caffeine_intake).toEqual(50);
    expect(result!.alcohol_intake).toEqual(0);
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.wellness_score).toBeGreaterThan(80.0); // Should be high with good values
  });

  it('should save updated entry to database', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 6.5,
      stress_level: 8
    };

    await updateWellnessEntry(updateInput);

    // Query the database directly to verify the update
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, testEntry.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(parseFloat(entry.sleep_hours)).toEqual(6.5);
    expect(entry.stress_level).toEqual(8);
    expect(entry.caffeine_intake).toEqual(150); // Should remain unchanged
    expect(entry.alcohol_intake).toEqual(1); // Should remain unchanged
    expect(parseFloat(entry.wellness_score)).toBeLessThan(75.0); // Should be lower with worse values
  });

  it('should return null for non-existent entry', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 99999, // Non-existent ID
      sleep_hours: 8.0
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeNull();
  });

  it('should handle edge case values correctly', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 0.5, // Very low sleep
      stress_level: 10, // Maximum stress
      caffeine_intake: 1000, // High caffeine
      alcohol_intake: 10 // High alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(0.5);
    expect(result!.stress_level).toEqual(10);
    expect(result!.caffeine_intake).toEqual(1000);
    expect(result!.alcohol_intake).toEqual(10);
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.wellness_score).toBeLessThan(30.0); // Should be very low with poor values
  });

  it('should calculate optimal wellness score correctly', async () => {
    // Create test entry
    const testEntry = await createTestWellnessEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 8.0, // Optimal sleep
      stress_level: 1, // Minimum stress
      caffeine_intake: 50, // Low caffeine
      alcohol_intake: 0 // No alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify optimal wellness score calculation
    expect(result).not.toBeNull();
    expect(result!.wellness_score).toBeCloseTo(100.0, 1); // Should be close to perfect score
  });

  it('should preserve unchanged fields when partial update is performed', async () => {
    // Create test entry with specific values
    const testEntry = await createTestWellnessEntry();
    const originalDate = new Date(testEntry.date);
    const originalCreatedAt = testEntry.created_at;

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      stress_level: 7 // Only update stress level
    };

    const result = await updateWellnessEntry(updateInput);

    // Verify unchanged fields are preserved
    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('test-user-123');
    expect(result!.date.getTime()).toEqual(originalDate.getTime());
    expect(result!.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(result!.sleep_hours).toEqual(8.0); // Should remain unchanged
    expect(result!.caffeine_intake).toEqual(150); // Should remain unchanged
    expect(result!.alcohol_intake).toEqual(1); // Should remain unchanged
    expect(result!.stress_level).toEqual(7); // Should be updated
  });
});
