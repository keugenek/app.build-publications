import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type UpdateWellnessEntryInput } from '../schema';
import { updateWellnessEntry } from '../handlers/update_wellness_entry';
import { eq } from 'drizzle-orm';

// Test data for creating an entry
const createInput: CreateWellnessEntryInput = {
  date: new Date('2023-01-15'),
  sleep_hours: 8,
  stress_level: 5,
  caffeine_intake: 2,
  alcohol_intake: 1,
};

// Create an entry first, then update it
const updateInput: UpdateWellnessEntryInput = {
  id: 1,
  sleep_hours: 6,
  stress_level: 8,
};

describe('updateWellnessEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test entry first
    await db.insert(wellnessEntriesTable).values({
      date: createInput.date.toISOString().split('T')[0],
      sleep_hours: createInput.sleep_hours.toString(),
      stress_level: createInput.stress_level,
      caffeine_intake: createInput.caffeine_intake,
      alcohol_intake: createInput.alcohol_intake,
      wellness_score: '0', // Will be recalculated
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update a wellness entry', async () => {
    const result = await updateWellnessEntry(updateInput);

    // Basic field validation
    expect(result.id).toEqual(1);
    expect(result.sleep_hours).toEqual(6);
    expect(result.stress_level).toEqual(8);
    expect(result.caffeine_intake).toEqual(createInput.caffeine_intake); // Unchanged
    expect(result.alcohol_intake).toEqual(createInput.alcohol_intake); // Unchanged
    expect(result.date).toEqual(createInput.date); // Unchanged
    expect(typeof result.wellness_score).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at).not.toEqual(result.created_at);
  });

  it('should save updated entry to database', async () => {
    const result = await updateWellnessEntry(updateInput);

    // Query the database
    const entries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.sleep_hours).toEqual('6.0');
    expect(entry.stress_level).toEqual(8);
    expect(parseFloat(entry.wellness_score)).toBeCloseTo(result.wellness_score);
    expect(entry.updated_at).toBeInstanceOf(Date);
  });

  it('should recalculate wellness score correctly', async () => {
    const result = await updateWellnessEntry(updateInput);
    
    // Calculate expected score:
    // Sleep score: min(10, (6/24)*10) = 2.5
    // Stress score: 11 - 8 = 3
    // Caffeine score: max(0, 10 - 2) = 8
    // Alcohol score: max(0, 10 - 1) = 9
    // Wellness score: (2.5 + 3 + 8 + 9) / 4 = 5.625
    const expectedScore = 5.625;
    
    expect(result.wellness_score).toBeCloseTo(expectedScore, 2);
  });

  it('should throw error when updating non-existent entry', async () => {
    const invalidInput: UpdateWellnessEntryInput = {
      id: 999,
      sleep_hours: 7,
    };
    
    await expect(updateWellnessEntry(invalidInput)).rejects.toThrow(/not found/i);
  });

  it('should update all fields when provided', async () => {
    const fullUpdateInput: UpdateWellnessEntryInput = {
      id: 1,
      date: new Date('2023-01-20'),
      sleep_hours: 7,
      stress_level: 3,
      caffeine_intake: 1,
      alcohol_intake: 0,
    };

    const result = await updateWellnessEntry(fullUpdateInput);

    expect(result.date).toEqual(new Date('2023-01-20'));
    expect(result.sleep_hours).toEqual(7);
    expect(result.stress_level).toEqual(3);
    expect(result.caffeine_intake).toEqual(1);
    expect(result.alcohol_intake).toEqual(0);
  });
});
