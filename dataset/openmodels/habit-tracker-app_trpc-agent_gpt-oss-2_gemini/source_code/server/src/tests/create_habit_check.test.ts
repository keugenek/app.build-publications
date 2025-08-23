import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitChecksTable } from '../db/schema';
import { type CreateHabitCheckInput, type HabitCheck } from '../schema';
import { createHabitCheck } from '../handlers/create_habit_check';
import { eq } from 'drizzle-orm';

// Helper to create a habit for tests
const createTestHabit = async () => {
  const result = await db.insert(habitsTable)
    .values({
      name: 'Test Habit',
      description: 'Testing habit checks',
    })
    .returning()
    .execute();
  return result[0];
};

describe('createHabitCheck', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a habit check with default date when none provided', async () => {
    const habit = await createTestHabit();
    const input: CreateHabitCheckInput = { habit_id: habit.id };
    const result = await createHabitCheck(input);

    // Verify fields
    expect(result.id).toBeDefined();
    expect(result.habit_id).toBe(habit.id);
    expect(result.completed).toBe(true);
    // Default date should be today (ignore time component)
    const today = new Date();
    expect(result.check_date.toDateString()).toBe(today.toDateString());
  });

  it('creates a habit check with provided date', async () => {
    const habit = await createTestHabit();
    const specificDate = new Date('2023-01-01');
    const input: CreateHabitCheckInput = { habit_id: habit.id, check_date: specificDate };
    const result = await createHabitCheck(input);

    expect(result.check_date.toDateString()).toBe(specificDate.toDateString());
  });

  it('saves the habit check to the database', async () => {
    const habit = await createTestHabit();
    const input: CreateHabitCheckInput = { habit_id: habit.id };
    const result = await createHabitCheck(input);

    const rows = await db.select()
      .from(habitChecksTable)
      .where(eq(habitChecksTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const stored = rows[0];
    expect(stored.habit_id).toBe(habit.id);
    expect(stored.completed).toBe(true);
    expect(new Date(stored.check_date).toDateString()).toBe(new Date().toDateString());
  });

  it('throws an error when habit does not exist', async () => {
    const input: CreateHabitCheckInput = { habit_id: 9999 };
    await expect(createHabitCheck(input)).rejects.toThrow(/does not exist/i);
  });
});
