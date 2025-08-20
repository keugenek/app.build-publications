import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { getHabitsWithStreaks } from '../handlers/get_habits_with_streaks';

describe('getHabitsWithStreaks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabitsWithStreaks();
    expect(result).toEqual([]);
  });

  it('should return habit with zero streak when no tracking records exist', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'Test habit description'
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(habit.id);
    expect(result[0].name).toBe('Test Habit');
    expect(result[0].description).toBe('Test habit description');
    expect(result[0].current_streak).toBe(0);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return habit with zero streak when no completed tracking records exist', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: null
      })
      .returning()
      .execute();

    // Create incomplete tracking record
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: '2024-01-15',
        completed: false
      })
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(0);
  });

  it('should calculate streak of 1 for single completed day', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Daily Exercise',
        description: 'Exercise every day'
      })
      .returning()
      .execute();

    // Create one completed tracking record for today
    const today = new Date().toISOString().split('T')[0];
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: today,
        completed: true
      })
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1);
  });

  it('should calculate consecutive streak correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Daily Reading',
        description: 'Read every day'
      })
      .returning()
      .execute();

    // Create consecutive completed tracking records for last 3 days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    await db.insert(habitTrackingTable)
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
  });

  it('should break streak when there is a gap', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Daily Meditation',
        description: 'Meditate daily'
      })
      .returning()
      .execute();

    // Create tracking records with a gap
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.insert(habitTrackingTable)
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
        // Gap: day before yesterday is missing
        {
          habit_id: habit.id,
          date: threeDaysAgo.toISOString().split('T')[0],
          completed: true
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(2); // Only today and yesterday count
  });

  it('should handle multiple habits independently', async () => {
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

    // Create different streak patterns for each habit
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Habit 1: 2-day streak
    await db.insert(habitTrackingTable)
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

    // Habit 2: 1-day streak (only today)
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit2.id,
        date: today.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(2);
    
    // Results should be ordered by created_at desc
    const exerciseHabit = result.find(h => h.name === 'Exercise');
    const readingHabit = result.find(h => h.name === 'Reading');

    expect(exerciseHabit?.current_streak).toBe(2);
    expect(readingHabit?.current_streak).toBe(1);
  });

  it('should ignore incomplete tracking records when calculating streaks', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Water Intake',
        description: 'Drink 8 glasses daily'
      })
      .returning()
      .execute();

    // Create mix of complete and incomplete records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(habitTrackingTable)
      .values([
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: false // Not completed
        }
      ])
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].current_streak).toBe(1); // Only today counts
  });

  it('should handle habits with null descriptions correctly', async () => {
    // Create a habit with null description
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Simple Habit',
        description: null
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Simple Habit');
    expect(result[0].description).toBeNull();
    expect(result[0].current_streak).toBe(0);
  });

  it('should return habits ordered by created_at descending', async () => {
    // Create multiple habits with slight time differences
    const [habit1] = await db.insert(habitsTable)
      .values({
        name: 'First Habit',
        description: 'Created first'
      })
      .returning()
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [habit2] = await db.insert(habitsTable)
      .values({
        name: 'Second Habit',
        description: 'Created second'
      })
      .returning()
      .execute();

    const result = await getHabitsWithStreaks();

    expect(result).toHaveLength(2);
    // Most recently created habit should be first
    expect(result[0].name).toBe('Second Habit');
    expect(result[1].name).toBe('First Habit');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });
});
