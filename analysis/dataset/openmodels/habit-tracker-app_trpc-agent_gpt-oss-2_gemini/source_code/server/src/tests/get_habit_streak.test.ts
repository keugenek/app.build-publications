import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitChecksTable } from '../db/schema';
// import { eq } from 'drizzle-orm';
import { getHabitStreak } from '../handlers/get_habit_streak';

// Helper to create a habit and return its id
const createHabit = async (name: string, description: string | null = null) => {
  const result = await db
    .insert(habitsTable)
    .values({ name, description })
    .returning()
    .execute();
  return result[0].id;
};

// Helper to add a habit check for a specific date (date object without time)
const addHabitCheck = async (habitId: number, date: Date) => {
  // Ensure date has no time component (PostgreSQL date column)
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  await db
    .insert(habitChecksTable)
    .values({ habit_id: habitId, check_date: cleanDate.toISOString().split('T')[0] })
    .execute();
};

describe('getHabitStreak', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('calculates streak correctly when today and yesterday are checked', async () => {
    const habitId = await createHabit('Exercise');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    await addHabitCheck(habitId, today);
    await addHabitCheck(habitId, yesterday);

    const result = await getHabitStreak();
    const habitStreak = result.find((r) => r.habitId === habitId);
    expect(habitStreak).toBeDefined();
    expect(habitStreak!.streak).toBe(2);
  });

  it('returns streak 0 when today is not checked', async () => {
    const habitId = await createHabit('Read');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await addHabitCheck(habitId, yesterday);

    const result = await getHabitStreak();
    const habitStreak = result.find((r) => r.habitId === habitId);
    expect(habitStreak).toBeDefined();
    expect(habitStreak!.streak).toBe(0);
  });

  it('handles multiple habits independently', async () => {
    const habitA = await createHabit('Meditate');
    const habitB = await createHabit('Write');
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Habit A has checks for today and yesterday -> streak 2
    await addHabitCheck(habitA, today);
    await addHabitCheck(habitA, yesterday);

    // Habit B has a check two days ago only -> streak 0 (today missing)
    await addHabitCheck(habitB, twoDaysAgo);

    const result = await getHabitStreak();
    const streakA = result.find((r) => r.habitId === habitA);
    const streakB = result.find((r) => r.habitId === habitB);
    expect(streakA).toBeDefined();
    expect(streakA!.streak).toBe(2);
    expect(streakB).toBeDefined();
    expect(streakB!.streak).toBe(0);
  });
});
