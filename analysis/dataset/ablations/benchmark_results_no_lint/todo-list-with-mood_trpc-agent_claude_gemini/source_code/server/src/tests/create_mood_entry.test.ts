import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput } from '../schema';
import { createMoodEntry } from '../handlers/create_mood_entry';
import { eq } from 'drizzle-orm';

// Test input for a standard mood entry
const testInput: CreateMoodEntryInput = {
  mood_score: 4,
  notes: 'Feeling good today!',
  entry_date: '2024-01-15'
};

describe('createMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new mood entry', async () => {
    const result = await createMoodEntry(testInput);

    // Basic field validation
    expect(result.mood_score).toEqual(4);
    expect(result.notes).toEqual('Feeling good today!');
    expect(result.entry_date).toBeInstanceOf(Date);
    expect(result.entry_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save mood entry to database', async () => {
    const result = await createMoodEntry(testInput);

    // Query the database to verify the entry was saved
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].mood_score).toEqual(4);
    expect(entries[0].notes).toEqual('Feeling good today!');
    expect(entries[0].entry_date).toEqual('2024-01-15');
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should create mood entry with null notes when notes not provided', async () => {
    const inputWithoutNotes: CreateMoodEntryInput = {
      mood_score: 3,
      entry_date: '2024-01-16'
    };

    const result = await createMoodEntry(inputWithoutNotes);

    expect(result.mood_score).toEqual(3);
    expect(result.notes).toBeNull();
    expect(result.entry_date).toBeInstanceOf(Date);
    expect(result.entry_date.toISOString().split('T')[0]).toEqual('2024-01-16');
  });

  it('should create mood entry with null notes when notes explicitly set to null', async () => {
    const inputWithNullNotes: CreateMoodEntryInput = {
      mood_score: 2,
      notes: null,
      entry_date: '2024-01-17'
    };

    const result = await createMoodEntry(inputWithNullNotes);

    expect(result.mood_score).toEqual(2);
    expect(result.notes).toBeNull();
    expect(result.entry_date).toBeInstanceOf(Date);
    expect(result.entry_date.toISOString().split('T')[0]).toEqual('2024-01-17');
  });

  it('should update existing mood entry for the same date', async () => {
    // Create initial entry
    const initialResult = await createMoodEntry(testInput);
    expect(initialResult.mood_score).toEqual(4);
    expect(initialResult.notes).toEqual('Feeling good today!');

    // Update the entry for the same date
    const updateInput: CreateMoodEntryInput = {
      mood_score: 5,
      notes: 'Feeling amazing now!',
      entry_date: '2024-01-15' // Same date
    };

    const updatedResult = await createMoodEntry(updateInput);

    // Should have the same ID but updated values
    expect(updatedResult.id).toEqual(initialResult.id);
    expect(updatedResult.mood_score).toEqual(5);
    expect(updatedResult.notes).toEqual('Feeling amazing now!');
    expect(updatedResult.entry_date).toBeInstanceOf(Date);
    expect(updatedResult.entry_date.toISOString().split('T')[0]).toEqual('2024-01-15');

    // Verify only one entry exists for this date
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.entry_date, '2024-01-15'))
      .execute();

    expect(allEntries).toHaveLength(1);
    expect(allEntries[0].mood_score).toEqual(5);
    expect(allEntries[0].notes).toEqual('Feeling amazing now!');
  });

  it('should handle different dates correctly', async () => {
    // Create entries for different dates
    const entry1Input: CreateMoodEntryInput = {
      mood_score: 3,
      notes: 'Monday blues',
      entry_date: '2024-01-15'
    };

    const entry2Input: CreateMoodEntryInput = {
      mood_score: 5,
      notes: 'Tuesday triumph',
      entry_date: '2024-01-16'
    };

    const result1 = await createMoodEntry(entry1Input);
    const result2 = await createMoodEntry(entry2Input);

    // Should be different entries
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.entry_date).toBeInstanceOf(Date);
    expect(result1.entry_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result2.entry_date).toBeInstanceOf(Date);
    expect(result2.entry_date.toISOString().split('T')[0]).toEqual('2024-01-16');

    // Verify both entries exist in database
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should handle boundary mood scores correctly', async () => {
    // Test minimum mood score
    const minMoodInput: CreateMoodEntryInput = {
      mood_score: 1,
      notes: 'Rough day',
      entry_date: '2024-01-18'
    };

    const minResult = await createMoodEntry(minMoodInput);
    expect(minResult.mood_score).toEqual(1);

    // Test maximum mood score
    const maxMoodInput: CreateMoodEntryInput = {
      mood_score: 5,
      notes: 'Best day ever!',
      entry_date: '2024-01-19'
    };

    const maxResult = await createMoodEntry(maxMoodInput);
    expect(maxResult.mood_score).toEqual(5);
  });

  it('should preserve created_at timestamp when updating existing entry', async () => {
    // Create initial entry
    const initialResult = await createMoodEntry(testInput);
    const originalCreatedAt = initialResult.created_at;

    // Wait a small amount to ensure timestamp difference would be detectable
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the entry
    const updateInput: CreateMoodEntryInput = {
      mood_score: 2,
      notes: 'Updated entry',
      entry_date: '2024-01-15' // Same date
    };

    const updatedResult = await createMoodEntry(updateInput);

    // created_at should remain the same (from original creation)
    expect(updatedResult.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    expect(updatedResult.mood_score).toEqual(2);
    expect(updatedResult.notes).toEqual('Updated entry');
  });
});
