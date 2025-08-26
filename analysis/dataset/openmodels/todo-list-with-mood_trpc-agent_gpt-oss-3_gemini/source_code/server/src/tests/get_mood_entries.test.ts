import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type MoodEntry } from '../schema';
import { getMoodEntries } from '../handlers/get_mood_entries';

// Helper to insert a mood entry
const insertMoodEntry = async (entry: {
  date: Date;
  rating: number;
  note?: string | null;
}) => {
  const dateString = entry.date.toISOString().split('T')[0]; // format YYYY-MM-DD
  const result = await db.insert(moodEntriesTable)
    .values({
      date: dateString,
      rating: entry.rating,
      note: entry.note ?? null,
    })
    .returning()
    .execute();
  const raw = result[0] as any;
  // Convert date string back to Date
  const moodEntry: MoodEntry = {
    ...raw,
    date: new Date(raw.date),
  };
  return moodEntry;
};


describe('getMoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no entries exist', async () => {
    const entries = await getMoodEntries();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries).toHaveLength(0);
  });

  it('should fetch all mood entries from the database', async () => {
    // Insert two mood entries
    const now = new Date();
    const entry1 = await insertMoodEntry({ date: now, rating: 7, note: 'Good day' });
    const entry2 = await insertMoodEntry({ date: new Date(now.getTime() + 86400000), rating: 4, note: null });

    const entries = await getMoodEntries();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries).toHaveLength(2);

    // Verify fields and types
    const fetched1 = entries.find(e => e.id === entry1.id);
    const fetched2 = entries.find(e => e.id === entry2.id);
    expect(fetched1).toBeDefined();
    expect(fetched2).toBeDefined();

    if (fetched1) {
      expect(fetched1.date).toEqual(entry1.date);
      expect(fetched1.rating).toBe(7);
      expect(fetched1.note).toBe('Good day');
      expect(fetched1.created_at).toBeInstanceOf(Date);
    }
    if (fetched2) {
      expect(fetched2.rating).toBe(4);
      expect(fetched2.note).toBeNull();
    }
  });
});
