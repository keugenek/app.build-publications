import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { getHabits } from '../handlers/get_habits';

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toEqual([]);
  });

  it('should return habits with correct streak information', async () => {
    // Create test habits
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit 1',
        description: 'Description 1'
      })
      .returning()
      .execute();
    
    const habitResult2 = await db.insert(habitsTable)
      .values({
        name: 'Test Habit 2',
        description: 'Description 2'
      })
      .returning()
      .execute();

    const habit1 = habitResult[0];
    const habit2 = habitResult2[0];

    // Add tracking records for habit 1 to create a streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Create tracking records for habit 1 (3-day streak)
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit1.id,
        date: today.toISOString().split('T')[0],
        completed: true
      })
      .execute();
      
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit1.id,
        date: yesterday.toISOString().split('T')[0],
        completed: true
      })
      .execute();
      
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit1.id,
        date: twoDaysAgo.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    // Create tracking records for habit 2 (1-day streak)
    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit2.id,
        date: today.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    const result = await getHabits();
    
    expect(result).toHaveLength(2);
    
    const habitOneResult = result.find(h => h.id === habit1.id);
    const habitTwoResult = result.find(h => h.id === habit2.id);
    
    expect(habitOneResult).toBeDefined();
    expect(habitOneResult!.name).toEqual('Test Habit 1');
    expect(habitOneResult!.description).toEqual('Description 1');
    expect(habitOneResult!.current_streak).toEqual(3);
    expect(habitOneResult!.longest_streak).toEqual(3);
    
    expect(habitTwoResult).toBeDefined();
    expect(habitTwoResult!.name).toEqual('Test Habit 2');
    expect(habitTwoResult!.description).toEqual('Description 2');
    expect(habitTwoResult!.current_streak).toEqual(1);
    expect(habitTwoResult!.longest_streak).toEqual(1);
  });

  it('should handle habits with no tracking records', async () => {
    // Create a habit without any tracking records
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Untracked Habit',
        description: 'No tracking records'
      })
      .returning()
      .execute();

    const habit = habitResult[0];

    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(habit.id);
    expect(result[0].name).toEqual('Untracked Habit');
    expect(result[0].current_streak).toEqual(0);
    expect(result[0].longest_streak).toEqual(0);
  });

  it('should handle broken streaks correctly', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Habit with Broken Streak',
        description: 'Streak testing'
      })
      .returning()
      .execute();

    const habit = habitResult[0];

    // Add non-consecutive tracking records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: today.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: threeDaysAgo.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: fiveDaysAgo.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(habit.id);
    expect(result[0].name).toEqual('Habit with Broken Streak');
    expect(result[0].current_streak).toEqual(1); // Only today is completed
    expect(result[0].longest_streak).toEqual(1); // Each completion is standalone
  });

  it('should handle incomplete tracking records', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Habit with Incomplete Records',
        description: 'Mixed completion'
      })
      .returning()
      .execute();

    const habit = habitResult[0];

    // Add mixed tracking records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: today.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: yesterday.toISOString().split('T')[0],
        completed: false // Not completed - breaks streak
      })
      .execute();

    await db.insert(habitTrackingTable)
      .values({
        habit_id: habit.id,
        date: twoDaysAgo.toISOString().split('T')[0],
        completed: true
      })
      .execute();

    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(habit.id);
    expect(result[0].name).toEqual('Habit with Incomplete Records');
    expect(result[0].current_streak).toEqual(1); // Only today is completed
    expect(result[0].longest_streak).toEqual(1); // Longest single completion
  });
});
