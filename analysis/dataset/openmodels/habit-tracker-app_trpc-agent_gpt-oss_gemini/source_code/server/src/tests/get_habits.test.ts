import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { getHabits } from '../handlers/get_habits';


/**\n * Helper to insert a habit directly into the DB for test setup.\n */
const insertHabit = async (name: string) => {
  const [habit] = await db
    .insert(habitsTable)
    .values({ name })
    .returning()
    .execute();
  return habit;
};

describe('getHabits handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(0);
  });

  it('should return all habits from the database', async () => {
    // Insert two habits
    const habitA = await insertHabit('Read a book');
    const habitB = await insertHabit('Exercise');

    const result = await getHabits();
    // Verify both habits are returned
    expect(result).toHaveLength(2);
    const names = result.map(h => h.name);
    expect(names).toContain('Read a book');
    expect(names).toContain('Exercise');
    // Verify IDs and created_at types
    const ids = result.map(h => h.id);
    expect(ids).toContain(habitA.id);
    expect(ids).toContain(habitB.id);
    result.forEach(h => {
      expect(typeof h.id).toBe('number');
      expect(typeof h.name).toBe('string');
      expect(h.created_at).toBeInstanceOf(Date);
    });
  });
});
