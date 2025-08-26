import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { getMoodEntries } from '../handlers/get_mood_entries';

describe('getMoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no mood entries exist', async () => {
    const result = await getMoodEntries();
    expect(result).toEqual([]);
  });

  it('should return all mood entries ordered by date', async () => {
    // Insert test data
    const testEntries = [
      {
        date: '2023-01-15',
        mood_level: 8,
        notes: 'Had a great day!'
      },
      {
        date: '2023-01-10',
        mood_level: 5,
        notes: 'Average day'
      },
      {
        date: '2023-01-20',
        mood_level: 3,
        notes: 'Feeling down'
      }
    ];

    // Insert entries
    for (const entry of testEntries) {
      await db.insert(moodEntriesTable).values(entry).execute();
    }

    const result = await getMoodEntries();

    // Should return 3 entries
    expect(result).toHaveLength(3);

    // Should be ordered by date (ascending)
    expect(result[0].date).toEqual(new Date('2023-01-10'));
    expect(result[1].date).toEqual(new Date('2023-01-15'));
    expect(result[2].date).toEqual(new Date('2023-01-20'));

    // Check that all fields are properly mapped
    expect(result[0]).toEqual({
      id: expect.any(Number),
      date: new Date('2023-01-10'),
      mood_level: 5,
      notes: 'Average day',
      created_at: expect.any(Date)
    });

    // Validate data types
    result.forEach(entry => {
      expect(typeof entry.id).toBe('number');
      expect(entry.date).toBeInstanceOf(Date);
      expect(typeof entry.mood_level).toBe('number');
      expect(typeof entry.notes).toBe('string');
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle entries with null notes', async () => {
    // Insert test data with null notes
    await db.insert(moodEntriesTable).values({
      date: '2023-01-15',
      mood_level: 7,
      notes: null
    }).execute();

    const result = await getMoodEntries();

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
  });
});
