import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { type UpdateHabitInput } from '../schema';
import { updateHabit } from '../handlers/update_habit';
import { eq, and } from 'drizzle-orm';

describe('updateHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update habit completion status and calculate streaks correctly', async () => {
    // First create a habit directly in database
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habitId = habitResult[0].id;
    
    // Update habit to mark as completed today
    const updateInput: UpdateHabitInput = {
      id: habitId,
      is_completed_today: true
    };
    
    const result = await updateHabit(updateInput);
    
    // Validate the returned habit data
    expect(result.id).toEqual(habitId);
    expect(result.name).toEqual('Test Habit');
    expect(result.is_completed_today).toBe(true);
    expect(result.current_streak).toBe(1);
    expect(result.longest_streak).toBe(1);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save habit entry to database', async () => {
    // First create a habit directly in database
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habitId = habitResult[0].id;
    
    // Update habit to mark as completed today
    const updateInput: UpdateHabitInput = {
      id: habitId,
      is_completed_today: true
    };
    
    await updateHabit(updateInput);
    
    // Query habit entries to verify the entry was saved
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entries = await db.select()
      .from(habitEntriesTable)
      .where(
        and(
          eq(habitEntriesTable.habit_id, habitId),
          eq(habitEntriesTable.date, today)
        )
      )
      .execute();
    
    expect(entries).toHaveLength(1);
    expect(entries[0].completed).toBe(true);
    expect(entries[0].habit_id).toEqual(habitId);
    expect(entries[0].date).toEqual(today);
  });

  it('should correctly calculate streaks when habit is completed for multiple consecutive days', async () => {
    // First create a habit directly in database
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habitId = habitResult[0].id;
    
    // Manually create some previous entries to simulate a streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    // Create previous completed entries
    await db.insert(habitEntriesTable).values([
      {
        habit_id: habitId,
        date: twoDaysAgo,
        completed: true
      },
      {
        habit_id: habitId,
        date: yesterday,
        completed: true
      }
    ]).execute();
    
    // Update habit to mark as completed today
    const updateInput: UpdateHabitInput = {
      id: habitId,
      is_completed_today: true
    };
    
    const result = await updateHabit(updateInput);
    
    // Should have a 3-day streak
    expect(result.is_completed_today).toBe(true);
    expect(result.current_streak).toBe(3);
    expect(result.longest_streak).toBe(3);
  });

  it('should correctly calculate streaks when habit is not completed today', async () => {
    // First create a habit directly in database
    const habitResult = await db.insert(habitsTable)
      .values({ name: 'Test Habit' })
      .returning()
      .execute();
    
    const habitId = habitResult[0].id;
    
    // Create a previous completed entry
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    await db.insert(habitEntriesTable).values({
      habit_id: habitId,
      date: yesterday,
      completed: true
    }).execute();
    
    // Update habit to mark as NOT completed today
    const updateInput: UpdateHabitInput = {
      id: habitId,
      is_completed_today: false
    };
    
    const result = await updateHabit(updateInput);
    
    // Should have 0 current streak but 1 longest streak
    expect(result.is_completed_today).toBe(false);
    expect(result.current_streak).toBe(0);
    expect(result.longest_streak).toBe(1);
  });

  it('should handle updating a non-existent habit', async () => {
    const updateInput: UpdateHabitInput = {
      id: 99999,
      is_completed_today: true
    };
    
    await expect(updateHabit(updateInput)).rejects.toThrow(/not found/i);
  });
});
