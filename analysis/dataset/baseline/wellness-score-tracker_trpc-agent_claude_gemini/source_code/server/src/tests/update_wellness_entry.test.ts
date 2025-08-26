import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a test wellness entry
async function createTestEntry() {
  const result = await db.insert(wellnessEntriesTable)
    .values({
      sleep_hours: '8.0',
      stress_level: 5,
      caffeine_intake: '200.0',
      alcohol_intake: '1.0',
      wellness_score: '75.0', // This will be recalculated in updates
      entry_date: '2024-01-01'
    })
    .returning()
    .execute();
  
  return result[0];
}

describe('updateWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing wellness entry', async () => {
    // Create test entry
    const testEntry = await createTestEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 7.5,
      stress_level: 3,
      caffeine_intake: 150.0,
      alcohol_intake: 0.5,
      entry_date: '2024-01-02'
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testEntry.id);
    expect(result!.sleep_hours).toEqual(7.5);
    expect(result!.stress_level).toEqual(3);
    expect(result!.caffeine_intake).toEqual(150.0);
    expect(result!.alcohol_intake).toEqual(0.5);
    expect(result!.entry_date).toEqual(new Date('2024-01-02'));
    expect(result!.created_at).toBeInstanceOf(Date);
    
    // Verify wellness score was recalculated
    expect(typeof result!.wellness_score).toBe('number');
    expect(result!.wellness_score).toBeGreaterThan(0);
    expect(result!.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should update only specified fields', async () => {
    const testEntry = await createTestEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 9.0,
      stress_level: 2
      // Other fields not specified - should remain unchanged
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(9.0);
    expect(result!.stress_level).toEqual(2);
    // Unchanged fields should retain original values
    expect(result!.caffeine_intake).toEqual(200.0);
    expect(result!.alcohol_intake).toEqual(1.0);
    expect(result!.entry_date).toEqual(new Date('2024-01-01'));
  });

  it('should recalculate wellness score when contributing fields change', async () => {
    const testEntry = await createTestEntry();
    const originalScore = parseFloat(testEntry.wellness_score);

    // Update to optimal sleep and low stress - should increase score
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 8.0, // Optimal range
      stress_level: 1    // Very low stress
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.wellness_score).toBeGreaterThan(originalScore);
  });

  it('should persist changes to database', async () => {
    const testEntry = await createTestEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 6.5,
      caffeine_intake: 300.0
    };

    await updateWellnessEntry(updateInput);

    // Verify changes were saved to database
    const dbEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, testEntry.id))
      .execute();

    expect(dbEntries).toHaveLength(1);
    const dbEntry = dbEntries[0];
    expect(parseFloat(dbEntry.sleep_hours)).toEqual(6.5);
    expect(parseFloat(dbEntry.caffeine_intake)).toEqual(300.0);
    // Verify unchanged fields
    expect(dbEntry.stress_level).toEqual(5);
    expect(parseFloat(dbEntry.alcohol_intake)).toEqual(1.0);
  });

  it('should return null for non-existent entry', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 999999, // Non-existent ID
      sleep_hours: 8.0
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeNull();
  });

  it('should handle edge case values correctly', async () => {
    const testEntry = await createTestEntry();

    // Test with boundary values
    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 0.0,    // Minimum sleep
      stress_level: 10,     // Maximum stress
      caffeine_intake: 0.0, // No caffeine
      alcohol_intake: 0.0   // No alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(0.0);
    expect(result!.stress_level).toEqual(10);
    expect(result!.caffeine_intake).toEqual(0.0);
    expect(result!.alcohol_intake).toEqual(0.0);
    
    // Wellness score should still be valid
    expect(result!.wellness_score).toBeGreaterThanOrEqual(0);
    expect(result!.wellness_score).toBeLessThanOrEqual(100);
  });

  it('should handle decimal precision correctly', async () => {
    const testEntry = await createTestEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 7.75,
      caffeine_intake: 123.45,
      alcohol_intake: 2.33
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.sleep_hours).toEqual(7.75);
    expect(result!.caffeine_intake).toEqual(123.45);
    expect(result!.alcohol_intake).toEqual(2.33);
  });

  it('should handle date string updates correctly', async () => {
    const testEntry = await createTestEntry();

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      entry_date: '2024-12-25'
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.entry_date).toEqual(new Date('2024-12-25'));
    
    // Verify in database
    const dbEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, testEntry.id))
      .execute();

    expect(dbEntries[0].entry_date).toEqual('2024-12-25');
  });

  it('should maintain created_at timestamp unchanged', async () => {
    const testEntry = await createTestEntry();
    const originalCreatedAt = testEntry.created_at;

    const updateInput: UpdateWellnessEntryInput = {
      id: testEntry.id,
      sleep_hours: 9.0
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at).toEqual(originalCreatedAt);
  });
});
