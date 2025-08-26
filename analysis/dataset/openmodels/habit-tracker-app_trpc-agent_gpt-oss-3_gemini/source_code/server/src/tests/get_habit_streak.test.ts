// Tests for the getHabitStreak handler
import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { getHabitStreak } from '../handlers/get_habit_streak';
// import { eq } from 'drizzle-orm';

// Helper to create a habit and return its id
const createHabit = async (name: string) => {
  const [habit] = await db
    .insert(habitsTable)
    .values({ name })
    .returning()
    .execute();
  return habit.id;
};

// Helper to insert a completion for a habit on a specific date
const addCompletion = async (habitId: number, date: Date) => {
  const dateString = date.toISOString().split('T')[0]; // format YYYY-MM-DD
  await db
    .insert(habitCompletionsTable)
    .values({ habit_id: habitId, date: dateString })
    .execute();
};
  

describe('getHabitStreak', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns 0 when there are no completions', async () => {
    const habitId = await createHabit('No completions');
    const streak = await getHabitStreak(habitId);
    expect(streak).toBe(0);
  });

  it('calculates streak for consecutive days', async () => {
    const habitId = await createHabit('Consecutive');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    // Insert three consecutive completions
    await addCompletion(habitId, today);
    await addCompletion(habitId, yesterday);
    await addCompletion(habitId, dayBefore);

    const streak = await getHabitStreak(habitId);
    expect(streak).toBe(3);
  });

  it('stops streak at first missing day', async () => {
    const habitId = await createHabit('Gap');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Insert today and two days ago, skipping yesterday
    await addCompletion(habitId, today);
    await addCompletion(habitId, twoDaysAgo);

    const streak = await getHabitStreak(habitId);
    expect(streak).toBe(1);
  });

  it('ignores future completions', async () => {
    const habitId = await createHabit('Future');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await addCompletion(habitId, today);
    await addCompletion(habitId, tomorrow);

    const streak = await getHabitStreak(habitId);
    // Only today's completion counts toward the streak
    expect(streak).toBe(1);
  });
});
