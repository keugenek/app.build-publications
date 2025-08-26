import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput } from '../schema';
import { getMoodEntries } from '../handlers/get_mood_entries';

describe('getMoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no mood entries exist', async () => {
    const result = await getMoodEntries();

    expect(result).toEqual([]);
  });

  it('should fetch all mood entries ordered by entry date descending', async () => {
    // Create test mood entries with different dates
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Insert mood entries in random order
    await db.insert(moodEntriesTable).values([
      {
        mood_score: 3,
        notes: 'Middle entry',
        entry_date: yesterday
      },
      {
        mood_score: 5,
        notes: 'Latest entry',
        entry_date: today
      },
      {
        mood_score: 2,
        notes: 'Oldest entry',
        entry_date: twoDaysAgo
      }
    ]).execute();

    const result = await getMoodEntries();

    // Should return 3 entries
    expect(result).toHaveLength(3);

    // Should be ordered by entry_date descending (most recent first)
    expect(result[0].notes).toEqual('Latest entry');
    expect(result[0].mood_score).toEqual(5);
    expect(result[1].notes).toEqual('Middle entry');
    expect(result[1].mood_score).toEqual(3);
    expect(result[2].notes).toEqual('Oldest entry');
    expect(result[2].mood_score).toEqual(2);

    // Verify date ordering
    expect(result[0].entry_date >= result[1].entry_date).toBe(true);
    expect(result[1].entry_date >= result[2].entry_date).toBe(true);
  });

  it('should return proper data types for all fields', async () => {
    // Create a mood entry
    await db.insert(moodEntriesTable).values({
      mood_score: 4,
      notes: 'Test entry with all fields',
      entry_date: '2024-01-15'
    }).execute();

    const result = await getMoodEntries();

    expect(result).toHaveLength(1);
    const entry = result[0];

    // Verify all field types
    expect(typeof entry.id).toBe('number');
    expect(typeof entry.mood_score).toBe('number');
    expect(typeof entry.notes).toBe('string');
    expect(entry.entry_date).toBeInstanceOf(Date);
    expect(entry.created_at).toBeInstanceOf(Date);

    // Verify field values
    expect(entry.mood_score).toEqual(4);
    expect(entry.notes).toEqual('Test entry with all fields');
    expect(entry.id).toBeDefined();
  });

  it('should handle mood entries with null notes', async () => {
    // Create mood entry with null notes
    await db.insert(moodEntriesTable).values({
      mood_score: 3,
      notes: null,
      entry_date: '2024-01-15'
    }).execute();

    const result = await getMoodEntries();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].mood_score).toEqual(3);
  });

  it('should handle multiple entries with same date', async () => {
    const sameDate = '2024-01-15';

    // Create multiple entries for same date
    await db.insert(moodEntriesTable).values([
      {
        mood_score: 2,
        notes: 'Morning mood',
        entry_date: sameDate
      },
      {
        mood_score: 4,
        notes: 'Evening mood',
        entry_date: sameDate
      }
    ]).execute();

    const result = await getMoodEntries();

    expect(result).toHaveLength(2);
    // Both should have same entry_date
    expect(result[0].entry_date.toISOString().split('T')[0]).toEqual(sameDate);
    expect(result[1].entry_date.toISOString().split('T')[0]).toEqual(sameDate);

    // Verify both entries are returned
    const moodScores = result.map(entry => entry.mood_score).sort();
    expect(moodScores).toEqual([2, 4]);
  });

  it('should verify database persistence', async () => {
    // Create a mood entry
    const insertResult = await db.insert(moodEntriesTable).values({
      mood_score: 5,
      notes: 'Excellent day!',
      entry_date: '2024-01-15'
    }).returning().execute();

    const result = await getMoodEntries();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(insertResult[0].id);
    expect(result[0].mood_score).toEqual(5);
    expect(result[0].notes).toEqual('Excellent day!');
    
    // Verify the entry_date matches what we inserted
    expect(result[0].entry_date.toISOString().split('T')[0]).toEqual('2024-01-15');
  });
});
