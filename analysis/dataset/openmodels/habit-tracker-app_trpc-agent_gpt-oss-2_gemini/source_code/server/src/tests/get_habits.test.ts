import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';
import { getHabits } from '../handlers/get_habits';
import { eq } from 'drizzle-orm';

describe('getHabits handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all habits from the database', async () => {
    // Insert a habit directly via db to set up data
    const insertResult = await db.insert(habitsTable)
      .values({
        name: 'Read a book',
        description: 'Read 20 pages daily',
      })
      .returning()
      .execute();

    const insertedHabit = insertResult[0];
    expect(insertedHabit).toBeDefined();
    expect(insertedHabit.id).toBeDefined();
    expect(insertedHabit.created_at).toBeInstanceOf(Date);

    const habits = await getHabits();
    expect(habits).toHaveLength(1);
    const habit = habits[0];
    expect(habit.id).toEqual(insertedHabit.id);
    expect(habit.name).toEqual('Read a book');
    expect(habit.description).toEqual('Read 20 pages daily');
    expect(habit.created_at).toBeInstanceOf(Date);
  });

  it('should correctly handle nullable description', async () => {
    const insertResult = await db.insert(habitsTable)
      .values({
        name: 'Meditate',
        description: null,
      })
      .returning()
      .execute();
    const inserted = insertResult[0];
    expect(inserted.description).toBeNull();

    const habits = await getHabits();
    const habit = habits.find(h => h.id === inserted.id);
    expect(habit).toBeDefined();
    if (habit) {
      expect(habit.description).toBeNull();
    }
  });
});
