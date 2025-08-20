import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckinsTable } from '../db/schema';
import { getHabitsWithStreaks } from '../handlers/get_habits_with_streaks';

describe('getHabitsWithStreaks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabitsWithStreaks();
    expect(result).toEqual([]);
  });

  it('should return habit with zero streaks when no checkins exist', async () => {
    // Create a habit without any checkins
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A test habit'
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: habit.id,
      name: 'Test Habit',
      description: 'A test habit',
      created_at: habit.created_at,
      current_streak: 0,
      longest_streak: 0,
      completed_today: false
    });
  });

  it('should calculate current streak correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Daily Exercise',
        description: 'Exercise every day'
      })
      .returning()
      .execute();

    // Create checkins for the last 3 days (all completed)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: dayBefore.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(3);
    expect(result[0].completed_today).toBe(true);
  });

  it('should handle broken current streak correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Reading',
        description: 'Read daily'
      })
      .returning()
      .execute();

    // Create checkins: completed today and 2 days ago, but missed yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: false // Missed yesterday
        },
        {
          habit_id: habit.id,
          date: dayBefore.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1); // Only today counts
    expect(result[0].completed_today).toBe(true);
  });

  it('should calculate longest streak correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Meditation',
        description: 'Daily meditation'
      })
      .returning()
      .execute();

    // Create checkins with different streak patterns
    const dates = [];
    const today = new Date();
    
    // Create dates for the past 10 days
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Pattern: 3 days completed, 2 days missed, 4 days completed, 1 day missed
    const completedPattern = [true, true, true, false, false, true, true, true, true, false];

    await db.insert(habitCheckinsTable)
      .values(
        dates.map((date, index) => ({
          habit_id: habit.id,
          date,
          completed: completedPattern[index]
        }))
      )
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].longest_streak).toBe(4); // Days 5-8 form the longest streak
    expect(result[0].current_streak).toBe(0); // Current streak is broken (last day was missed)
  });

  it('should handle current streak starting yesterday when today is not completed', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Journal',
        description: 'Daily journaling'
      })
      .returning()
      .execute();

    // Create checkins: not completed today, but completed yesterday and day before
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: dayBefore.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2); // Yesterday and day before
    expect(result[0].completed_today).toBe(false);
  });

  it('should handle multiple habits correctly', async () => {
    // Create two habits
    const [habit1] = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily exercise'
      })
      .returning()
      .execute();

    const [habit2] = await db.insert(habitsTable)
      .values({
        name: 'Reading',
        description: 'Daily reading'
      })
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Habit 1: completed today and yesterday (streak of 2)
    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit1.id,
          date: today.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit1.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    // Habit 2: only completed yesterday (streak of 1, not today)
    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit2.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(2);

    // Find habits by name for easier testing
    const exerciseHabit = result.find(h => h.name === 'Exercise');
    const readingHabit = result.find(h => h.name === 'Reading');

    expect(exerciseHabit).toBeDefined();
    expect(exerciseHabit!.current_streak).toBe(2);
    expect(exerciseHabit!.completed_today).toBe(true);

    expect(readingHabit).toBeDefined();
    expect(readingHabit!.current_streak).toBe(1);
    expect(readingHabit!.completed_today).toBe(false);
  });

  it('should handle single day streaks correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Water',
        description: 'Drink water'
      })
      .returning()
      .execute();

    // Single completed checkin
    const today = new Date();
    await db.insert(habitCheckinsTable)
      .values([
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1);
    expect(result[0].longest_streak).toBe(1);
    expect(result[0].completed_today).toBe(true);
  });
});
