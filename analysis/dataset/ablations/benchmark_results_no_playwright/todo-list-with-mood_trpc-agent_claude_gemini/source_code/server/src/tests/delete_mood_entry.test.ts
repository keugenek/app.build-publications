import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DeleteMoodEntryInput, type CreateMoodEntryInput } from '../schema';
import { deleteMoodEntry } from '../handlers/delete_mood_entry';
import { eq } from 'drizzle-orm';

// Test input for creating mood entries
const testMoodEntryInput: CreateMoodEntryInput = {
  date: '2024-01-15',
  mood_score: 4,
  note: 'Feeling good today'
};

describe('deleteMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing mood entry', async () => {
    // First create a mood entry
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: testMoodEntryInput.date,
        mood_score: testMoodEntryInput.mood_score,
        note: testMoodEntryInput.note
      })
      .returning()
      .execute();

    const createdEntry = createResult[0];
    expect(createdEntry.id).toBeDefined();

    // Now delete the mood entry
    const deleteInput: DeleteMoodEntryInput = {
      id: createdEntry.id
    };

    const result = await deleteMoodEntry(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify the mood entry is actually deleted from database
    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(moodEntries).toHaveLength(0);
  });

  it('should return false for non-existent mood entry', async () => {
    // Try to delete a mood entry that doesn't exist
    const deleteInput: DeleteMoodEntryInput = {
      id: 99999
    };

    const result = await deleteMoodEntry(deleteInput);

    // Should return false since no entry was deleted
    expect(result.success).toBe(false);
  });

  it('should only delete the specified mood entry', async () => {
    // Create multiple mood entries
    const entry1 = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-15',
        mood_score: 4,
        note: 'First entry'
      })
      .returning()
      .execute();

    const entry2 = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-16',
        mood_score: 3,
        note: 'Second entry'
      })
      .returning()
      .execute();

    // Delete only the first entry
    const deleteInput: DeleteMoodEntryInput = {
      id: entry1[0].id
    };

    const result = await deleteMoodEntry(deleteInput);
    expect(result.success).toBe(true);

    // Verify first entry is deleted
    const deletedEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, entry1[0].id))
      .execute();

    expect(deletedEntry).toHaveLength(0);

    // Verify second entry still exists
    const remainingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, entry2[0].id))
      .execute();

    expect(remainingEntry).toHaveLength(1);
    expect(remainingEntry[0].note).toBe('Second entry');
  });

  it('should handle mood entries without notes', async () => {
    // Create a mood entry without a note
    const createResult = await db.insert(moodEntriesTable)
      .values({
        date: '2024-01-17',
        mood_score: 5,
        note: null
      })
      .returning()
      .execute();

    const createdEntry = createResult[0];

    // Delete the mood entry
    const deleteInput: DeleteMoodEntryInput = {
      id: createdEntry.id
    };

    const result = await deleteMoodEntry(deleteInput);

    // Should successfully delete
    expect(result.success).toBe(true);

    // Verify deletion
    const moodEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(moodEntries).toHaveLength(0);
  });
});
