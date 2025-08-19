import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { getHabitsWithStreaks } from '../handlers/get_habits_with_streaks';

describe('getHabitsWithStreaks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabitsWithStreaks();
    expect(result).toEqual([]);
  });

  it('should return habit with zero streaks when no completions exist', async () => {
    // Create a habit without completions
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily workout'
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: habit.id,
      name: 'Exercise',
      description: 'Daily workout',
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      is_completed_today: false
    });
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should calculate current streak correctly when completed today', async () => {
    // Create habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Reading',
        description: 'Daily reading'
      })
      .returning()
      .execute();

    // Create completions for today and yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habit.id,
          completed_at: today.toISOString().split('T')[0] // Today
        },
        {
          habit_id: habit.id,
          completed_at: yesterday.toISOString().split('T')[0] // Yesterday
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2);
    expect(result[0].longest_streak).toBe(2);
    expect(result[0].total_completions).toBe(2);
    expect(result[0].is_completed_today).toBe(true);
  });

  it('should calculate current streak correctly when not completed today', async () => {
    // Create habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Meditation',
        description: null
      })
      .returning()
      .execute();

    // Create completions for yesterday and day before yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(dayBefore.getDate() - 1);

    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habit.id,
          completed_at: yesterday.toISOString().split('T')[0]
        },
        {
          habit_id: habit.id,
          completed_at: dayBefore.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2);
    expect(result[0].longest_streak).toBe(2);
    expect(result[0].total_completions).toBe(2);
    expect(result[0].is_completed_today).toBe(false);
  });

  it('should calculate longest streak correctly with gaps', async () => {
    // Create habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Water',
        description: 'Drink water'
      })
      .returning()
      .execute();

    // Create completions with gaps
    const today = new Date();
    const dates = [];
    
    // First streak: 3 days (days -10, -9, -8)
    for (let i = 10; i >= 8; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Gap of 2 days
    
    // Second streak: 4 days (days -5, -4, -3, -2) - this should be the longest
    for (let i = 5; i >= 2; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Gap of 1 day
    
    // Current streak: 1 day (today)
    dates.push(today.toISOString().split('T')[0]);

    await db.insert(habitCompletionsTable)
      .values(dates.map(date => ({
        habit_id: habit.id,
        completed_at: date
      })))
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1); // Only today
    expect(result[0].longest_streak).toBe(4); // Days -5 to -2
    expect(result[0].total_completions).toBe(8);
    expect(result[0].is_completed_today).toBe(true);
  });

  it('should handle multiple habits correctly', async () => {
    // Create two habits
    const habits = await db.insert(habitsTable)
      .values([
        {
          name: 'Exercise',
          description: 'Daily workout'
        },
        {
          name: 'Reading',
          description: 'Read books'
        }
      ])
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // First habit: completed today and yesterday
    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habits[0].id,
          completed_at: today.toISOString().split('T')[0]
        },
        {
          habit_id: habits[0].id,
          completed_at: yesterday.toISOString().split('T')[0]
        }
      ])
      .execute();

    // Second habit: completed only today
    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habits[1].id,
          completed_at: today.toISOString().split('T')[0]
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
    expect(exerciseHabit!.longest_streak).toBe(2);
    expect(exerciseHabit!.total_completions).toBe(2);
    expect(exerciseHabit!.is_completed_today).toBe(true);

    expect(readingHabit).toBeDefined();
    expect(readingHabit!.current_streak).toBe(1);
    expect(readingHabit!.longest_streak).toBe(1);
    expect(readingHabit!.total_completions).toBe(1);
    expect(readingHabit!.is_completed_today).toBe(true);
  });

  it('should handle single day completion correctly', async () => {
    // Create habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Journaling',
        description: 'Write daily journal'
      })
      .returning()
      .execute();

    // Complete only 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habit.id,
          completed_at: threeDaysAgo.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(0); // Not consecutive from today
    expect(result[0].longest_streak).toBe(1); // One day completion
    expect(result[0].total_completions).toBe(1);
    expect(result[0].is_completed_today).toBe(false);
  });

  it('should return habits ordered by creation date (newest first)', async () => {
    // Create habits with small delay to ensure different timestamps
    const [firstHabit] = await db.insert(habitsTable)
      .values({
        name: 'First Habit',
        description: 'Created first'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [secondHabit] = await db.insert(habitsTable)
      .values({
        name: 'Second Habit',
        description: 'Created second'
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(2);
    // Should be ordered by created_at DESC (newest first)
    expect(result[0].name).toBe('Second Habit');
    expect(result[1].name).toBe('First Habit');
  });
});
