import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput } from '../schema';
import { createMoodEntry } from '../handlers/create_mood_entry';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMoodEntryInput = {
  mood_rating: 4,
  note: 'Feeling pretty good today',
  date: '2024-01-15'
};

describe('createMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new mood entry', async () => {
    const result = await createMoodEntry(testInput);

    // Basic field validation
    expect(result.mood_rating).toEqual(4);
    expect(result.note).toEqual('Feeling pretty good today');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save mood entry to database', async () => {
    const result = await createMoodEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].mood_rating).toEqual(4);
    expect(entries[0].note).toEqual('Feeling pretty good today');
    expect(entries[0].date).toEqual('2024-01-15');
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should use today\'s date when date is not provided', async () => {
    const inputWithoutDate: CreateMoodEntryInput = {
      mood_rating: 3,
      note: 'Default date test'
    };

    const result = await createMoodEntry(inputWithoutDate);
    const today = new Date().toISOString().split('T')[0];

    expect(result.mood_rating).toEqual(3);
    expect(result.note).toEqual('Default date test');
    expect(result.date).toEqual(new Date(today));
  });

  it('should update existing entry for the same date', async () => {
    // Create initial entry
    const initialResult = await createMoodEntry(testInput);

    // Create another entry for the same date with different values
    const updateInput: CreateMoodEntryInput = {
      mood_rating: 5,
      note: 'Updated mood entry',
      date: '2024-01-15'
    };

    const updatedResult = await createMoodEntry(updateInput);

    // Should have the same ID (updated existing entry)
    expect(updatedResult.id).toEqual(initialResult.id);
    expect(updatedResult.mood_rating).toEqual(5);
    expect(updatedResult.note).toEqual('Updated mood entry');
    expect(updatedResult.date).toEqual(new Date('2024-01-15'));

    // Verify only one entry exists for this date
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, '2024-01-15'))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].mood_rating).toEqual(5);
    expect(entries[0].note).toEqual('Updated mood entry');
  });

  it('should handle null notes correctly', async () => {
    const inputWithNullNote: CreateMoodEntryInput = {
      mood_rating: 2,
      note: null,
      date: '2024-01-16'
    };

    const result = await createMoodEntry(inputWithNullNote);

    expect(result.mood_rating).toEqual(2);
    expect(result.note).toBeNull();
    expect(result.date).toEqual(new Date('2024-01-16'));

    // Verify in database
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, result.id))
      .execute();

    expect(entries[0].note).toBeNull();
  });

  it('should create separate entries for different dates', async () => {
    // Create first entry
    const firstEntry = await createMoodEntry({
      mood_rating: 3,
      note: 'First day',
      date: '2024-01-15'
    });

    // Create second entry for different date
    const secondEntry = await createMoodEntry({
      mood_rating: 4,
      note: 'Second day',
      date: '2024-01-16'
    });

    expect(firstEntry.id).not.toEqual(secondEntry.id);
    expect(firstEntry.date).toEqual(new Date('2024-01-15'));
    expect(secondEntry.date).toEqual(new Date('2024-01-16'));

    // Verify both entries exist in database
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should handle boundary mood ratings correctly', async () => {
    // Test minimum rating
    const minRatingResult = await createMoodEntry({
      mood_rating: 1,
      note: 'Minimum rating test',
      date: '2024-01-17'
    });

    expect(minRatingResult.mood_rating).toEqual(1);

    // Test maximum rating
    const maxRatingResult = await createMoodEntry({
      mood_rating: 5,
      note: 'Maximum rating test',
      date: '2024-01-18'
    });

    expect(maxRatingResult.mood_rating).toEqual(5);
  });
});
