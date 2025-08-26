import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { getHabit } from '../handlers/get_habit';
import { eq } from 'drizzle-orm';

describe('getHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent habit', async () => {
    const result = await getHabit(999);
    expect(result).toBeNull();
  });

  it('should return habit with zero streaks when no completions exist', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning();

    const result = await getHabit(habit.id);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(habit.id);
    expect(result!.name).toBe('Test Habit');
    expect(result!.description).toBe('A habit for testing');
    expect(result!.current_streak).toBe(0);
    expect(result!.longest_streak).toBe(0);
  });

  it('should return habit with correct streaks when completions exist', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create some completions
    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habit.id,
          date: twoDaysAgo.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        }
      ]);

    const result = await getHabit(habit.id);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(habit.id);
    expect(result!.name).toBe('Test Habit');
    expect(result!.current_streak).toBe(3);
    expect(result!.longest_streak).toBe(3);
  });

  it('should handle incomplete streaks correctly', async () => {
    // Create a habit
    const [habit] = await db.insert(habitsTable)
      .values({
        name: 'Test Habit',
        description: 'A habit for testing'
      })
      .returning();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Create completions with a gap (no completion two days ago)
    await db.insert(habitCompletionsTable)
      .values([
        {
          habit_id: habit.id,
          date: threeDaysAgo.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: yesterday.toISOString().split('T')[0],
          completed: true
        },
        {
          habit_id: habit.id,
          date: today.toISOString().split('T')[0],
          completed: true
        }
      ]);

    const result = await getHabit(habit.id);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(habit.id);
    expect(result!.current_streak).toBe(2); // Only today and yesterday are consecutive
    expect(result!.longest_streak).toBe(2); // The streak of 1 from 3 days ago is shorter
  });
});
