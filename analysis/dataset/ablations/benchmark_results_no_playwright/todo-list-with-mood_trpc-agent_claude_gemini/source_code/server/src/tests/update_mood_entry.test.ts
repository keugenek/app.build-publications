import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput } from '../schema';
import { updateMoodEntry } from '../handlers/update_mood_entry';
import { eq } from 'drizzle-orm';

describe('updateMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update mood score only', async () => {
    // Create test mood entry first
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 3,
        note: 'Original note'
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update only mood score
    const updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      mood_score: 5
    };

    const result = await updateMoodEntry(updateInput);

    // Verify mood score updated
    expect(result.mood_score).toEqual(5);
    expect(result.note).toEqual('Original note'); // Should remain unchanged
    expect(result.id).toEqual(originalEntry.id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.created_at).toEqual(originalEntry.created_at);
    expect(result.updated_at).not.toEqual(originalEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update note only', async () => {
    // Create test mood entry first
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 4,
        note: 'Original note'
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update only note
    const updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      note: 'Updated note'
    };

    const result = await updateMoodEntry(updateInput);

    // Verify note updated
    expect(result.note).toEqual('Updated note');
    expect(result.mood_score).toEqual(4); // Should remain unchanged
    expect(result.id).toEqual(originalEntry.id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.created_at).toEqual(originalEntry.created_at);
    expect(result.updated_at).not.toEqual(originalEntry.updated_at); // Should be updated
  });

  it('should update both mood score and note', async () => {
    // Create test mood entry first
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 2,
        note: 'Feeling low'
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update both fields
    const updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      mood_score: 4,
      note: 'Feeling better now'
    };

    const result = await updateMoodEntry(updateInput);

    // Verify both fields updated
    expect(result.mood_score).toEqual(4);
    expect(result.note).toEqual('Feeling better now');
    expect(result.id).toEqual(originalEntry.id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.created_at).toEqual(originalEntry.created_at);
    expect(result.updated_at).not.toEqual(originalEntry.updated_at); // Should be updated
  });

  it('should set note to null when explicitly provided', async () => {
    // Create test mood entry with existing note
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 3,
        note: 'Some note'
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update note to null
    const updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      note: null
    };

    const result = await updateMoodEntry(updateInput);

    // Verify note set to null
    expect(result.note).toBeNull();
    expect(result.mood_score).toEqual(3); // Should remain unchanged
  });

  it('should save updated entry to database', async () => {
    // Create test mood entry first
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 1,
        note: 'Bad day'
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Wait a moment to ensure updated_at timestamp will be different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the entry
    const updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      mood_score: 5,
      note: 'Great day!'
    };

    await updateMoodEntry(updateInput);

    // Query database to verify changes were saved
    const updatedEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, originalEntry.id))
      .execute();

    expect(updatedEntries).toHaveLength(1);
    const dbEntry = updatedEntries[0];
    expect(dbEntry.mood_score).toEqual(5);
    expect(dbEntry.note).toEqual('Great day!');
    expect(dbEntry.updated_at).not.toEqual(originalEntry.updated_at);
  });

  it('should throw error when mood entry not found', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: 999999, // Non-existent ID
      mood_score: 3
    };

    await expect(updateMoodEntry(updateInput)).rejects.toThrow(/Mood entry with id 999999 not found/i);
  });

  it('should handle mood score boundary values', async () => {
    // Create test mood entry first
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 3,
        note: null
      })
      .returning()
      .execute();

    const originalEntry = createResult[0];

    // Test minimum mood score
    let updateInput: UpdateMoodEntryInput = {
      id: originalEntry.id,
      mood_score: 1
    };

    let result = await updateMoodEntry(updateInput);
    expect(result.mood_score).toEqual(1);

    // Test maximum mood score
    updateInput = {
      id: originalEntry.id,
      mood_score: 5
    };

    result = await updateMoodEntry(updateInput);
    expect(result.mood_score).toEqual(5);
  });
});
