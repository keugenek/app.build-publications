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

  // Helper function to create a test mood entry
  const createTestMoodEntry = async () => {
    const result = await db.insert(moodEntriesTable)
      .values({
        mood_rating: 3,
        note: 'Original note',
        date: '2023-12-01', // Date column expects string format
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update mood rating only', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      mood_rating: 5,
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testEntry.id);
    expect(result.mood_rating).toEqual(5);
    expect(result.note).toEqual('Original note'); // Should remain unchanged
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.created_at).toEqual(testEntry.created_at);
  });

  it('should update note only', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      note: 'Updated note text',
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testEntry.id);
    expect(result.mood_rating).toEqual(3); // Should remain unchanged
    expect(result.note).toEqual('Updated note text');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.created_at).toEqual(testEntry.created_at);
  });

  it('should update both mood rating and note', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      mood_rating: 1,
      note: 'Feeling down today',
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testEntry.id);
    expect(result.mood_rating).toEqual(1);
    expect(result.note).toEqual('Feeling down today');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.created_at).toEqual(testEntry.created_at);
  });

  it('should set note to null when explicitly provided', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      note: null,
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testEntry.id);
    expect(result.mood_rating).toEqual(3); // Should remain unchanged
    expect(result.note).toBeNull();
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.created_at).toEqual(testEntry.created_at);
  });

  it('should persist changes to database', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      mood_rating: 4,
      note: 'Database persistence test',
    };

    await updateMoodEntry(updateInput);

    // Verify changes were persisted to database
    const savedEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, testEntry.id))
      .execute();

    expect(savedEntry).toHaveLength(1);
    expect(savedEntry[0].mood_rating).toEqual(4);
    expect(savedEntry[0].note).toEqual('Database persistence test');
    expect(savedEntry[0].date).toEqual(testEntry.date); // Database stores as string
  });

  it('should throw error when mood entry does not exist', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: 99999, // Non-existent ID
      mood_rating: 5,
    };

    await expect(updateMoodEntry(updateInput)).rejects.toThrow(/mood entry.*not found/i);
  });

  it('should handle edge case mood ratings', async () => {
    const testEntry = await createTestMoodEntry();
    
    // Test minimum rating
    const minInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      mood_rating: 1,
    };

    let result = await updateMoodEntry(minInput);
    expect(result.mood_rating).toEqual(1);

    // Test maximum rating
    const maxInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      mood_rating: 5,
    };

    result = await updateMoodEntry(maxInput);
    expect(result.mood_rating).toEqual(5);
  });

  it('should handle empty note string', async () => {
    const testEntry = await createTestMoodEntry();
    
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
      note: '',
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.note).toEqual('');
  });

  it('should not modify fields when no updates provided', async () => {
    const testEntry = await createTestMoodEntry();
    
    // Update with only ID (no actual changes)
    const updateInput: UpdateMoodEntryInput = {
      id: testEntry.id,
    };

    const result = await updateMoodEntry(updateInput);

    // All fields should remain unchanged
    expect(result.id).toEqual(testEntry.id);
    expect(result.mood_rating).toEqual(testEntry.mood_rating);
    expect(result.note).toEqual(testEntry.note);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2023-12-01');
    expect(result.created_at).toEqual(testEntry.created_at);
  });
});
