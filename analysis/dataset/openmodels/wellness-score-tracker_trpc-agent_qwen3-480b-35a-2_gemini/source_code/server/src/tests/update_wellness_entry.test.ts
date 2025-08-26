import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a wellness entry for testing
const createWellnessEntry = async (input: CreateWellnessEntryInput) => {
  // Simple wellness score calculation for test data
  const wellnessScore = Math.max(0, Math.min(100, 
    50 + 
    (input.sleep_hours >= 7 && input.sleep_hours <= 9 ? 20 : 0) -
    (input.stress_level - 1) * 2 -
    (input.caffeine_intake > 2 ? (input.caffeine_intake - 2) * 2 : 0) -
    input.alcohol_intake * 3
  ));

  const result = await db.insert(wellnessEntriesTable)
    .values({
      date: input.date.toISOString().split('T')[0], // Convert Date to string in YYYY-MM-DD format
      sleep_hours: input.sleep_hours.toString(),
      stress_level: input.stress_level,
      caffeine_intake: input.caffeine_intake.toString(),
      alcohol_intake: input.alcohol_intake.toString(),
      wellness_score: wellnessScore.toString()
    })
    .returning()
    .execute();

  const entry = result[0];
  return {
    ...entry,
    sleep_hours: parseFloat(entry.sleep_hours),
    caffeine_intake: parseFloat(entry.caffeine_intake),
    alcohol_intake: parseFloat(entry.alcohol_intake),
    wellness_score: parseFloat(entry.wellness_score)
  };
};

// Test input for creating an entry
const createTestInput: CreateWellnessEntryInput = {
  date: new Date('2023-01-15'),
  sleep_hours: 8,
  stress_level: 5,
  caffeine_intake: 1,
  alcohol_intake: 0
};

// Test input for updating an entry
const updateTestInput: UpdateWellnessEntryInput = {
  id: 1,
  sleep_hours: 6,
  stress_level: 3
};

describe('updateWellnessEntry', () => {
  beforeEach(async () => {
    await createDB();
    // Create a wellness entry to update
    await createWellnessEntry(createTestInput);
  });
  afterEach(resetDB);

  it('should update a wellness entry', async () => {
    const result = await updateWellnessEntry(updateTestInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.sleep_hours).toEqual(6);
    expect(result.stress_level).toEqual(3);
    expect(result.caffeine_intake).toEqual(1); // Should remain unchanged
    expect(result.alcohol_intake).toEqual(0); // Should remain unchanged
    expect(result.date.getTime()).toEqual(new Date('2023-01-15').getTime()); // Should remain unchanged
    expect(typeof result.wellness_score).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated wellness entry to database', async () => {
    const result = await updateWellnessEntry(updateTestInput);

    // Query the database to verify the update was saved
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.sleep_hours).toEqual('6.00');
    expect(entry.stress_level).toEqual(3);
    expect(parseFloat(entry.wellness_score)).toEqual(result.wellness_score);
    expect(entry.updated_at).toBeInstanceOf(Date);
    expect(entry.updated_at.getTime()).toBeGreaterThanOrEqual(entry.created_at.getTime());
  });

  it('should calculate wellness score correctly', async () => {
    // Update with specific values that give a predictable score
    const updateInput: UpdateWellnessEntryInput = {
      id: 1,
      sleep_hours: 8,    // Good sleep (+20)
      stress_level: 1,   // Low stress (+18, since 1-1=0, 0*2=0, 50-0=50)
      caffeine_intake: 1, // Low caffeine (no penalty)
      alcohol_intake: 0  // No alcohol (no penalty)
    };

    const result = await updateWellnessEntry(updateInput);
    
    // Expected calculation: 50 (base) + 20 (good sleep) + 18 (low stress) = 88
    // But stress calculation is: 50 - (1-1)*2 = 50 - 0 = 50
    // So: 50 (base) + 20 (good sleep) = 70
    expect(result.wellness_score).toBeCloseTo(70, 1);
  });

  it('should throw an error when updating a non-existent entry', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 999,
      sleep_hours: 7
    };

    await expect(updateWellnessEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should only update provided fields', async () => {
    const updateInput: UpdateWellnessEntryInput = {
      id: 1,
      stress_level: 2
      // Only updating stress_level, other fields should remain unchanged
    };

    const result = await updateWellnessEntry(updateInput);

    // Only stress_level should change
    expect(result.stress_level).toEqual(2);
    expect(result.sleep_hours).toEqual(8); // Original value
    expect(result.caffeine_intake).toEqual(1); // Original value
    expect(result.alcohol_intake).toEqual(0); // Original value
  });
});
