import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput, type UpdateMoodEntryInput } from '../schema';
import { updateMoodEntry } from '../handlers/update_mood_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a mood entry for testing
const createMoodEntry = async (input: CreateMoodEntryInput) => {
  const result = await db.insert(moodEntriesTable)
    .values({
      date: input.date.toISOString(), // Convert Date to ISO string for database
      mood_level: input.mood_level,
      notes: input.notes || null
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    date: new Date(result[0].date) // Convert string back to Date
  };
};

describe('updateMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a mood entry', async () => {
    // First create a mood entry
    const createdEntry = await createMoodEntry({
      date: new Date('2023-01-15'),
      mood_level: 7,
      notes: 'Feeling good today'
    });

    // Update the mood entry
    const updateInput: UpdateMoodEntryInput = {
      id: createdEntry.id,
      mood_level: 9,
      notes: 'Feeling great today!'
    };

    const result = await updateMoodEntry(updateInput);

    // Validate the returned result
    expect(result.id).toEqual(createdEntry.id);
    expect(result.mood_level).toEqual(9);
    expect(result.notes).toEqual('Feeling great today!');
    expect(result.date).toEqual(createdEntry.date); // Date should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only the provided fields', async () => {
    // First create a mood entry
    const createdEntry = await createMoodEntry({
      date: new Date('2023-01-15'),
      mood_level: 5,
      notes: 'Average day'
    });

    // Update only the mood_level
    const updateInput: UpdateMoodEntryInput = {
      id: createdEntry.id,
      mood_level: 8
      // notes is not provided, should remain unchanged
    };

    const result = await updateMoodEntry(updateInput);

    // Validate the returned result
    expect(result.id).toEqual(createdEntry.id);
    expect(result.mood_level).toEqual(8);
    expect(result.notes).toEqual('Average day'); // Should remain unchanged
    expect(result.date).toEqual(createdEntry.date);
  });

  it('should save updated mood entry to database', async () => {
    // First create a mood entry
    const createdEntry = await createMoodEntry({
      date: new Date('2023-01-15'),
      mood_level: 3,
      notes: 'Not feeling well'
    });

    // Update the mood entry
    const updateInput: UpdateMoodEntryInput = {
      id: createdEntry.id,
      notes: 'Feeling a bit better'
    };

    await updateMoodEntry(updateInput);

    // Query the database to verify the update was saved
    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(moodEntries).toHaveLength(1);
    const updatedEntry = moodEntries[0];
    expect(updatedEntry.id).toEqual(createdEntry.id);
    expect(updatedEntry.mood_level).toEqual(3); // Should remain unchanged
    expect(updatedEntry.notes).toEqual('Feeling a bit better'); // Should be updated
    expect(new Date(updatedEntry.date)).toEqual(new Date('2023-01-15')); // Should remain unchanged
    expect(updatedEntry.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when trying to update a non-existent mood entry', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: 99999, // Non-existent ID
      mood_level: 5
    };

    await expect(updateMoodEntry(updateInput))
      .rejects
      .toThrow(/Mood entry with id 99999 not found/);
  });
});
