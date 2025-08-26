import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a test wellness entry
const createTestEntry = async () => {
  const result = await db.insert(wellnessEntriesTable)
    .values({
      user_id: 1,
      date: '2024-01-01', // Date as string for pg date column
      hours_of_sleep: 8, // Number for real column
      stress_level: 3,
      caffeine_intake: 100, // Number for real column
      alcohol_intake: 1, // Number for real column
      wellness_score: 80 // Number for real column
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateWellnessEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a single field and recalculate wellness score', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 6 // Reduce sleep hours
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(entry.id);
    expect(result!.hours_of_sleep).toEqual(6);
    expect(result!.stress_level).toEqual(3); // Unchanged
    expect(result!.caffeine_intake).toEqual(100); // Unchanged
    expect(result!.alcohol_intake).toEqual(1); // Unchanged
    expect(result!.wellness_score).toBeLessThan(80); // Score should be lower due to less sleep
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields and recalculate wellness score', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 9, // Optimal sleep
      stress_level: 1, // Minimal stress
      caffeine_intake: 50, // Low caffeine
      alcohol_intake: 0 // No alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(entry.id);
    expect(result!.hours_of_sleep).toEqual(9);
    expect(result!.stress_level).toEqual(1);
    expect(result!.caffeine_intake).toEqual(50);
    expect(result!.alcohol_intake).toEqual(0);
    expect(result!.wellness_score).toBeGreaterThan(80); // Score should be higher
    expect(typeof result!.wellness_score).toBe('number');
  });

  it('should update only stress level', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      stress_level: 8 // High stress
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.stress_level).toEqual(8);
    expect(result!.hours_of_sleep).toEqual(8); // Unchanged
    expect(result!.caffeine_intake).toEqual(100); // Unchanged
    expect(result!.alcohol_intake).toEqual(1); // Unchanged
    expect(result!.wellness_score).toBeLessThan(80); // Score should be lower due to high stress
  });

  it('should update caffeine and alcohol intake', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      caffeine_intake: 500, // High caffeine
      alcohol_intake: 3 // High alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.caffeine_intake).toEqual(500);
    expect(result!.alcohol_intake).toEqual(3);
    expect(result!.hours_of_sleep).toEqual(8); // Unchanged
    expect(result!.stress_level).toEqual(3); // Unchanged
    expect(result!.wellness_score).toBeLessThan(80); // Score should be lower
  });

  it('should save updated values to database', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 7.5,
      stress_level: 2
    };

    await updateWellnessEntry(updateInput);

    // Verify changes were saved to database
    const dbEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, entry.id))
      .execute();

    expect(dbEntries).toHaveLength(1);
    const dbEntry = dbEntries[0];
    expect(dbEntry.hours_of_sleep).toEqual(7.5);
    expect(dbEntry.stress_level).toEqual(2);
    expect(dbEntry.caffeine_intake).toEqual(100); // Unchanged
    expect(dbEntry.alcohol_intake).toEqual(1); // Unchanged
    expect(dbEntry.updated_at).toBeInstanceOf(Date);
    expect(dbEntry.updated_at.getTime()).toBeGreaterThanOrEqual(entry.updated_at.getTime()); // Should be same or more recent
  });

  it('should return null for non-existent entry', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 99999, // Non-existent ID
      hours_of_sleep: 8
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeNull();
  });

  it('should calculate wellness score correctly for optimal values', async () => {
    const entry = await createTestEntry();
    
    // Set optimal values
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 8, // Optimal
      stress_level: 1, // Minimal
      caffeine_intake: 100, // Under 200mg - no penalty
      alcohol_intake: 0 // None
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.wellness_score).toEqual(100); // Should be perfect score
  });

  it('should calculate wellness score correctly for poor values', async () => {
    const entry = await createTestEntry();
    
    // Set poor values
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 4, // Very low sleep
      stress_level: 10, // Maximum stress
      caffeine_intake: 500, // High caffeine
      alcohol_intake: 3 // High alcohol
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    // Score calculation: 100 - 20 (sleep) - 45 (stress: (10-1)*5) - 15 (caffeine) - 20 (alcohol) = 0
    expect(result!.wellness_score).toEqual(0);
  });

  it('should handle partial updates correctly', async () => {
    const entry = await createTestEntry();
    const originalValues = {
      hours_of_sleep: entry.hours_of_sleep,
      stress_level: entry.stress_level,
      caffeine_intake: entry.caffeine_intake,
      alcohol_intake: entry.alcohol_intake
    };
    
    // Update only one field
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      stress_level: 5
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.stress_level).toEqual(5); // Changed
    expect(result!.hours_of_sleep).toEqual(originalValues.hours_of_sleep); // Unchanged
    expect(result!.caffeine_intake).toEqual(originalValues.caffeine_intake); // Unchanged
    expect(result!.alcohol_intake).toEqual(originalValues.alcohol_intake); // Unchanged
  });

  it('should handle decimal values correctly', async () => {
    const entry = await createTestEntry();
    
    const updateInput: UpdateWellnessEntryInput = {
      id: entry.id,
      hours_of_sleep: 7.5,
      caffeine_intake: 150.5,
      alcohol_intake: 1.5
    };

    const result = await updateWellnessEntry(updateInput);

    expect(result).toBeDefined();
    expect(result!.hours_of_sleep).toEqual(7.5);
    expect(result!.caffeine_intake).toEqual(150.5);
    expect(result!.alcohol_intake).toEqual(1.5);
    expect(typeof result!.hours_of_sleep).toBe('number');
    expect(typeof result!.caffeine_intake).toBe('number');
    expect(typeof result!.alcohol_intake).toBe('number');
  });
});
