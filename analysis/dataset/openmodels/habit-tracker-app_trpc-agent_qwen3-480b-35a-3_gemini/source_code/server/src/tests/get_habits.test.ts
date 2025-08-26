import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { getHabits } from '../handlers/get_habits';
import { eq } from 'drizzle-orm';

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toEqual([]);
  });

  it('should return habits with zero streaks when no completions exist', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A test habit'
      })
      .returning();

    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(habitResult[0].id);
    expect(result[0].name).toEqual('Test Habit');
    expect(result[0].description).toEqual('A test habit');
    expect(result[0].current_streak).toEqual(0);
    expect(result[0].longest_streak).toEqual(0);
  });

  it('should calculate correct streaks for habits with completions', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily exercise'
      })
      .returning();
    
    const habitId = habitResult[0].id;
    
    // Create some completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    // Format dates as strings for database
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];
    const twoDaysAgoString = twoDaysAgo.toISOString().split('T')[0];
    const threeDaysAgoString = threeDaysAgo.toISOString().split('T')[0];
    
    // Add completions for consecutive days with a break
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        date: todayString,
        completed: true
      });
    
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        date: yesterdayString,
        completed: true
      });
    
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        date: twoDaysAgoString,
        completed: true
      });
    
    // Skip three days ago to create a break in streak
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habitId,
        date: threeDaysAgoString,
        completed: false // This breaks the streak
      });
    
    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(habitId);
    expect(result[0].name).toEqual('Exercise');
    expect(result[0].current_streak).toEqual(3); // Today, yesterday, and two days ago
    expect(result[0].longest_streak).toEqual(3); // Same as current streak
  });

  it('should handle multiple habits correctly', async () => {
    // Create two habits
    const habit1Result = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily exercise'
      })
      .returning();
    
    const habit2Result = await db.insert(habitsTable)
      .values({
        name: 'Meditation',
        description: 'Daily meditation'
      })
      .returning();
    
    const habit1Id = habit1Result[0].id;
    const habit2Id = habit2Result[0].id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Format dates as strings for database
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Add completions for both habits
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit1Id,
        date: todayString,
        completed: true
      });
    
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit1Id,
        date: yesterdayString,
        completed: true
      });
    
    await db.insert(habitCompletionsTable)
      .values({
        habit_id: habit2Id,
        date: todayString,
        completed: true
      });
    
    const result = await getHabits();
    
    expect(result).toHaveLength(2);
    
    const exerciseHabit = result.find(h => h.id === habit1Id);
    const meditationHabit = result.find(h => h.id === habit2Id);
    
    expect(exerciseHabit).toBeDefined();
    expect(meditationHabit).toBeDefined();
    
    expect(exerciseHabit!.current_streak).toEqual(2);
    expect(exerciseHabit!.longest_streak).toEqual(2);
    
    expect(meditationHabit!.current_streak).toEqual(1);
    expect(meditationHabit!.longest_streak).toEqual(1);
  });
});
