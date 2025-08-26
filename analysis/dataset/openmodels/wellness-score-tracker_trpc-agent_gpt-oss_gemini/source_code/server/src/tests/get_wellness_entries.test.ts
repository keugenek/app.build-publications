import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';

// Helper to insert a wellness entry directly into the DB
const insertEntry = async (data: {
  entry_date: Date;
  sleep_hours: number;
  stress_level: number;
  caffeine_intake: number;
  alcohol_intake: number;
  wellness_score: number;
}) => {
  await db
    .insert(wellnessEntries)
    .values({
      entry_date: data.entry_date,
      sleep_hours: data.sleep_hours.toString(),
      stress_level: data.stress_level,
      caffeine_intake: data.caffeine_intake.toString(),
      alcohol_intake: data.alcohol_intake.toString(),
      wellness_score: data.wellness_score.toString()
    })
    .execute();
};

describe('getWellnessEntries handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns entries ordered by entry_date descending with numeric conversion', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Insert older entry first, newer second
    await insertEntry({
      entry_date: yesterday,
      sleep_hours: 6.5,
      stress_level: 4,
      caffeine_intake: 1.2,
      alcohol_intake: 0,
      wellness_score: 70.5
    });
    await insertEntry({
      entry_date: now,
      sleep_hours: 7.0,
      stress_level: 2,
      caffeine_intake: 0.5,
      alcohol_intake: 0,
      wellness_score: 85.0
    });

    const result = await getWellnessEntries();

    expect(result).toHaveLength(2);
    // Most recent first
    expect(result[0].entry_date.getTime()).toBeGreaterThanOrEqual(result[1].entry_date.getTime());
    // Verify numeric fields are numbers
    expect(typeof result[0].sleep_hours).toBe('number');
    expect(typeof result[0].caffeine_intake).toBe('number');
    expect(typeof result[0].alcohol_intake).toBe('number');
    expect(typeof result[0].wellness_score).toBe('number');
  });

  it('handles empty database', async () => {
    const result = await getWellnessEntries();
    expect(result).toEqual([]);
  });
});
