import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { getHabits } from '../handlers/get_habits';

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();
    
    expect(result).toEqual([]);
  });

  it('should return single habit', async () => {
    // Create a test habit
    const testHabit = await db.insert(habitsTable)
      .values({
        name: 'Exercise',
        description: 'Daily workout routine'
      })
      .returning()
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toEqual('Exercise');
    expect(result[0].description).toEqual('Daily workout routine');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple habits', async () => {
    // Create multiple test habits
    await db.insert(habitsTable)
      .values([
        {
          name: 'Exercise',
          description: 'Daily workout routine'
        },
        {
          name: 'Reading',
          description: 'Read for 30 minutes daily'
        },
        {
          name: 'Meditation',
          description: null // Test null description
        }
      ])
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(3);
    
    // Verify all habits have required fields
    result.forEach(habit => {
      expect(habit.id).toBeDefined();
      expect(habit.name).toBeDefined();
      expect(habit.created_at).toBeInstanceOf(Date);
    });

    // Check specific habits exist
    const exerciseHabit = result.find(h => h.name === 'Exercise');
    expect(exerciseHabit).toBeDefined();
    expect(exerciseHabit!.description).toEqual('Daily workout routine');

    const meditationHabit = result.find(h => h.name === 'Meditation');
    expect(meditationHabit).toBeDefined();
    expect(meditationHabit!.description).toBeNull();
  });

  it('should return habits in order they were created', async () => {
    // Create habits with slight delay to ensure different timestamps
    await db.insert(habitsTable)
      .values({
        name: 'First Habit',
        description: 'Created first'
      })
      .execute();

    await db.insert(habitsTable)
      .values({
        name: 'Second Habit',
        description: 'Created second'
      })
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Habit');
    expect(result[1].name).toEqual('Second Habit');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
