import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type MoodEntry, type Mood } from '../schema';
import { getMoods } from '../handlers/get_moods';
import { eq } from 'drizzle-orm';

// Helper to insert a mood entry
const insertMood = async (mood: Mood, note: string | null, date: Date) => {
  await db
    .insert(moodsTable)
    .values({
      mood: mood,
      note,
      date,
    })
    .execute();
};

describe('getMoods handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no moods exist', async () => {
    const moods = await getMoods();
    expect(moods).toEqual([]);
  });

  it('should retrieve all mood entries from the database', async () => {
    const now = new Date();
    await insertMood('Happy', 'Feeling great', now);
    await insertMood('Sad', null, new Date(now.getTime() - 86400000)); // yesterday

    const moods = await getMoods();
    expect(moods).toHaveLength(2);

    // Verify fields and types
    const happy = moods.find(m => m.mood === 'Happy');
    expect(happy).toBeDefined();
    expect(happy?.note).toBe('Feeling great');
    expect(happy?.date).toBeInstanceOf(Date);

    const sad = moods.find(m => m.mood === 'Sad');
    expect(sad).toBeDefined();
    expect(sad?.note).toBeNull();
    expect(sad?.date).toBeInstanceOf(Date);
  });
});
