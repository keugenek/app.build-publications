import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';
import { getHabits } from '../handlers/get_habits';

describe('getHabits handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should fetch all habits from the database', async () => {
    // Insert two habit records directly
    const insertResult = await db
      .insert(habitsTable)
      .values([
        { name: 'Read a book', description: 'Read 20 pages' },
        { name: 'Exercise', description: null },
      ])
      .returning()
      .execute();

    // Ensure insert succeeded
    expect(insertResult).toHaveLength(2);
    const insertedHabits: Habit[] = insertResult.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description ?? null,
      created_at: h.created_at,
    }));

    const fetched = await getHabits();
    expect(fetched).toHaveLength(2);

    // Sort both arrays by id for deterministic comparison
    const sortedInserted = insertedHabits.sort((a, b) => a.id - b.id);
    const sortedFetched = fetched.sort((a, b) => a.id - b.id);

    for (let i = 0; i < sortedInserted.length; i++) {
      const expected = sortedInserted[i];
      const actual = sortedFetched[i];
      expect(actual.id).toBe(expected.id);
      expect(actual.name).toBe(expected.name);
      expect(actual.description).toBe(expected.description);
      expect(actual.created_at).toBeInstanceOf(Date);
      // created_at should be close to now (within a reasonable range)
      const now = new Date();
      expect(Math.abs(actual.created_at.getTime() - now.getTime())).toBeLessThan(5000);
    }
  });
});
