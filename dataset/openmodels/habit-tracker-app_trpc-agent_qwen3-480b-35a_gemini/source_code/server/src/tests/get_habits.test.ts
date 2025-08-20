import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { getHabits } from '../handlers/get_habits';
import { eq } from 'drizzle-orm';

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toEqual([]);
  });

  it('should return habits with default streak values when no entries exist', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habit = habitResult[0];
    
    // Get habits with streaks
    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: habit.id,
      name: 'Test Habit',
      created_at: habit.created_at,
      is_completed_today: false,
      current_streak: 0,
      longest_streak: 0
    });
  });

  it('should calculate streaks correctly for habits with entries', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habit = habitResult[0];
    
    // Create some habit entries including today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Insert entries
    await db.insert(habitEntriesTable).values([
      { habit_id: habit.id, date: twoDaysAgo, completed: true },
      { habit_id: habit.id, date: yesterday, completed: true },
      { habit_id: habit.id, date: today, completed: true }
    ]).execute();
    
    // Get habits with streaks
    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: habit.id,
      name: 'Test Habit',
      created_at: habit.created_at,
      is_completed_today: true,
      current_streak: 3,
      longest_streak: 3
    });
  });

  it('should handle habit with completed entries but not completed today', async () => {
    // Create a habit
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habit = habitResult[0];
    
    // Create entries for previous days (but not today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Insert completed entries for previous days
    await db.insert(habitEntriesTable).values([
      { habit_id: habit.id, date: twoDaysAgo, completed: true },
      { habit_id: habit.id, date: yesterday, completed: true }
    ]).execute();
    
    // Get habits with streaks
    const result = await getHabits();
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: habit.id,
      name: 'Test Habit',
      created_at: habit.created_at,
      is_completed_today: false,
      current_streak: 0, // No streak since not completed today
      longest_streak: 2
    });
  });

  it('should handle multiple habits correctly', async () => {
    // Create multiple habits
    const habit1Result = await db.insert(habitsTable)
      .values({ name: 'Habit 1' })
      .returning()
      .execute();
    
    const habit2Result = await db.insert(habitsTable)
      .values({ name: 'Habit 2' })
      .returning()
      .execute();
    
    const habit1 = habit1Result[0];
    const habit2 = habit2Result[0];
    
    // Create entries for habit 1
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Insert entries for habit 1
    await db.insert(habitEntriesTable).values([
      { habit_id: habit1.id, date: yesterday, completed: true },
      { habit_id: habit1.id, date: today, completed: true }
    ]).execute();
    
    // Insert entry for habit 2 (only today, not completed)
    await db.insert(habitEntriesTable).values([
      { habit_id: habit2.id, date: today, completed: false }
    ]).execute();
    
    // Get habits with streaks
    const result = await getHabits();
    
    expect(result).toHaveLength(2);
    
    // Find each habit in the result
    const habit1ResultData = result.find(h => h.id === habit1.id);
    const habit2ResultData = result.find(h => h.id === habit2.id);
    
    expect(habit1ResultData).toEqual({
      id: habit1.id,
      name: 'Habit 1',
      created_at: habit1.created_at,
      is_completed_today: true,
      current_streak: 2,
      longest_streak: 2
    });
    
    expect(habit2ResultData).toEqual({
      id: habit2.id,
      name: 'Habit 2',
      created_at: habit2.created_at,
      is_completed_today: false,
      current_streak: 0,
      longest_streak: 0
    });
  });
});
