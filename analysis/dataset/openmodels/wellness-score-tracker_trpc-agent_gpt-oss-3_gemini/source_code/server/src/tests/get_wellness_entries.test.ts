import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { getWellnessEntries } from '../handlers/get_wellness_entries';
import { eq } from 'drizzle-orm';

/**
 * Helper to insert a wellness entry directly into the database.
 * Numeric columns are stored as strings, so we convert accordingly.
 */
async function insertEntry(entry: {
  sleep_hours: number;
  stress_level: number;
  caffeine_servings: number;
  alcohol_servings: number;
  wellness_score?: number;
}) {
  await db
    .insert(wellnessEntriesTable)
    .values({
      sleep_hours: entry.sleep_hours.toString(),
      stress_level: entry.stress_level,
      caffeine_servings: entry.caffeine_servings,
      alcohol_servings: entry.alcohol_servings,
      wellness_score: (entry.wellness_score ?? 0).toString()
    })
    .execute();
}

describe('getWellnessEntries handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no entries exist', async () => {
    const entries = await getWellnessEntries();
    expect(entries).toEqual([]);
  });

  it('should fetch all wellness entries with correct types', async () => {
    // Insert two distinct entries
    await insertEntry({
      sleep_hours: 7.5,
      stress_level: 3,
      caffeine_servings: 2,
      alcohol_servings: 1,
      wellness_score: 65
    });
    await insertEntry({
      sleep_hours: 6,
      stress_level: 2,
      caffeine_servings: 0,
      alcohol_servings: 0,
      wellness_score: 80
    });

    const entries = await getWellnessEntries();
    expect(entries).toHaveLength(2);

    // Verify each entry's numeric fields are numbers, not strings
    for (const e of entries) {
      expect(typeof e.sleep_hours).toBe('number');
      expect(typeof e.wellness_score).toBe('number');
      expect(typeof e.stress_level).toBe('number');
      expect(typeof e.caffeine_servings).toBe('number');
      expect(typeof e.alcohol_servings).toBe('number');
      expect(e.id).toBeDefined();
      expect(e.created_at).toBeInstanceOf(Date);
    }

    // Spot‑check values using a direct query to ensure DB storage matches expectations
    const dbRows = await db.select().from(wellnessEntriesTable).where(eq(wellnessEntriesTable.id, entries[0].id)).execute();
    expect(dbRows).toHaveLength(1);
    const storedRow = dbRows[0];
    expect(parseFloat(storedRow.sleep_hours as any)).toBeCloseTo(entries[0].sleep_hours);
    expect(parseFloat(storedRow.wellness_score as any)).toBeCloseTo(entries[0].wellness_score);
  });
});
