import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput } from '../schema';
import { createMoodEntry } from '../handlers/create_mood_entry';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateMoodEntryInput = {
  date: '2024-01-15',
  mood_score: 4,
  note: 'Feeling pretty good today!'
};

const testInputWithoutNote: CreateMoodEntryInput = {
  date: '2024-01-16',
  mood_score: 3,
  note: null
};

const testInputMinimalNote: CreateMoodEntryInput = {
  date: '2024-01-17',
  mood_score: 5
};

describe('createMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new mood entry', async () => {
    const result = await createMoodEntry(testInput);

    // Basic field validation
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.mood_score).toEqual(4);
    expect(result.note).toEqual('Feeling pretty good today!');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save mood entry to database', async () => {
    const result = await createMoodEntry(testInput);

    // Query database to verify entry was saved
    const entries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].date).toEqual('2024-01-15'); // Database returns date as string
    expect(entries[0].mood_score).toEqual(4);
    expect(entries[0].note).toEqual('Feeling pretty good today!');
    expect(entries[0].created_at).toBeInstanceOf(Date);
    expect(entries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle mood entry without note', async () => {
    const result = await createMoodEntry(testInputWithoutNote);

    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.mood_score).toEqual(3);
    expect(result.note).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle mood entry with undefined note', async () => {
    const result = await createMoodEntry(testInputMinimalNote);

    expect(result.date).toEqual(new Date('2024-01-17'));
    expect(result.mood_score).toEqual(5);
    expect(result.note).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should update existing mood entry for same date', async () => {
    // Create initial mood entry
    const firstEntry = await createMoodEntry({
      date: '2024-01-20',
      mood_score: 2,
      note: 'Not feeling great'
    });

    // Create another entry for the same date
    const updatedEntry = await createMoodEntry({
      date: '2024-01-20',
      mood_score: 4,
      note: 'Actually feeling better now!'
    });

    // Should have same ID (updated, not created new)
    expect(updatedEntry.id).toEqual(firstEntry.id);
    expect(updatedEntry.mood_score).toEqual(4);
    expect(updatedEntry.note).toEqual('Actually feeling better now!');
    expect(updatedEntry.updated_at.getTime()).toBeGreaterThan(firstEntry.updated_at.getTime());

    // Verify only one entry exists in database for this date
    const allEntriesForDate = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, '2024-01-20'))
      .execute();

    expect(allEntriesForDate).toHaveLength(1);
    expect(allEntriesForDate[0].mood_score).toEqual(4);
    expect(allEntriesForDate[0].note).toEqual('Actually feeling better now!');
  });

  it('should update existing entry and clear note when new entry has no note', async () => {
    // Create initial mood entry with note
    const firstEntry = await createMoodEntry({
      date: '2024-01-25',
      mood_score: 3,
      note: 'Some initial thoughts'
    });

    // Update with entry that has no note
    const updatedEntry = await createMoodEntry({
      date: '2024-01-25',
      mood_score: 5,
      note: null
    });

    // Should have same ID but note should be cleared
    expect(updatedEntry.id).toEqual(firstEntry.id);
    expect(updatedEntry.mood_score).toEqual(5);
    expect(updatedEntry.note).toBeNull();

    // Verify in database
    const dbEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, updatedEntry.id))
      .execute();

    expect(dbEntry[0].note).toBeNull();
  });

  it('should handle different dates as separate entries', async () => {
    // Create mood entries for different dates
    const entry1 = await createMoodEntry({
      date: '2024-01-10',
      mood_score: 3,
      note: 'Monday mood'
    });

    const entry2 = await createMoodEntry({
      date: '2024-01-11',
      mood_score: 4,
      note: 'Tuesday mood'
    });

    const entry3 = await createMoodEntry({
      date: '2024-01-12',
      mood_score: 2,
      note: 'Wednesday mood'
    });

    // Should have different IDs
    expect(entry1.id).not.toEqual(entry2.id);
    expect(entry2.id).not.toEqual(entry3.id);
    expect(entry1.id).not.toEqual(entry3.id);

    // Verify all entries exist in database
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(allEntries.length).toBeGreaterThanOrEqual(3);
    
    const dates = allEntries.map(entry => entry.date); // Database returns dates as strings
    expect(dates).toContain('2024-01-10');
    expect(dates).toContain('2024-01-11');
    expect(dates).toContain('2024-01-12');
  });

  it('should handle boundary mood scores correctly', async () => {
    // Test minimum mood score
    const minEntry = await createMoodEntry({
      date: '2024-02-01',
      mood_score: 1,
      note: 'Really bad day'
    });

    expect(minEntry.mood_score).toEqual(1);

    // Test maximum mood score
    const maxEntry = await createMoodEntry({
      date: '2024-02-02',
      mood_score: 5,
      note: 'Amazing day!'
    });

    expect(maxEntry.mood_score).toEqual(5);
  });
});
