import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { getHabits } from '../handlers/get_habits';

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();
    expect(result).toEqual([]);
  });

  it('should return all habits', async () => {
    // Create test habits directly in database
    const testHabits = [
      {
        name: 'Daily Exercise',
        description: 'Go for a 30-minute walk'
      },
      {
        name: 'Read Books',
        description: 'Read for at least 20 minutes'
      },
      {
        name: 'Meditation',
        description: null
      }
    ];

    // Insert test habits
    const insertedHabits = await db.insert(habitsTable)
      .values(testHabits)
      .returning()
      .execute();

    // Get habits using handler
    const result = await getHabits();

    // Verify all habits are returned
    expect(result).toHaveLength(3);
    
    // Verify basic structure and types
    result.forEach(habit => {
      expect(habit.id).toBeDefined();
      expect(typeof habit.id).toBe('number');
      expect(habit.name).toBeDefined();
      expect(typeof habit.name).toBe('string');
      expect(habit.created_at).toBeInstanceOf(Date);
      expect(['string', 'object']).toContain(typeof habit.description); // null or string
    });

    // Verify specific habit data
    const exerciseHabit = result.find(h => h.name === 'Daily Exercise');
    expect(exerciseHabit).toBeDefined();
    expect(exerciseHabit!.description).toBe('Go for a 30-minute walk');

    const readingHabit = result.find(h => h.name === 'Read Books');
    expect(readingHabit).toBeDefined();
    expect(readingHabit!.description).toBe('Read for at least 20 minutes');

    const meditationHabit = result.find(h => h.name === 'Meditation');
    expect(meditationHabit).toBeDefined();
    expect(meditationHabit!.description).toBeNull();
  });

  it('should return habits ordered by creation date (ascending)', async () => {
    // Create habits with specific timestamps to test ordering
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Insert habits in non-chronological order
    await db.insert(habitsTable).values([
      {
        name: 'Third Habit',
        description: 'Created tomorrow',
        created_at: tomorrow
      }
    ]).execute();

    await db.insert(habitsTable).values([
      {
        name: 'First Habit',
        description: 'Created yesterday',
        created_at: yesterday
      }
    ]).execute();

    await db.insert(habitsTable).values([
      {
        name: 'Second Habit',
        description: 'Created today',
        created_at: now
      }
    ]).execute();

    const result = await getHabits();

    // Verify correct ordering (ascending by creation date)
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('First Habit');
    expect(result[1].name).toBe('Second Habit');
    expect(result[2].name).toBe('Third Habit');

    // Verify timestamps are in ascending order
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeLessThan(result[2].created_at.getTime());
  });

  it('should handle habits with null descriptions correctly', async () => {
    // Insert habit with explicit null description
    await db.insert(habitsTable).values([
      {
        name: 'Simple Habit',
        description: null
      }
    ]).execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Simple Habit');
    expect(result[0].description).toBeNull();
  });

  it('should return consistent data structure across multiple calls', async () => {
    // Create a habit
    await db.insert(habitsTable).values([
      {
        name: 'Consistent Habit',
        description: 'Testing consistency'
      }
    ]).execute();

    // Call handler multiple times
    const result1 = await getHabits();
    const result2 = await getHabits();

    // Results should be identical
    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    
    // Verify structure consistency
    expect(result1[0].id).toBe(result2[0].id);
    expect(result1[0].name).toBe(result2[0].name);
    expect(result1[0].description).toBe(result2[0].description);
    expect(result1[0].created_at.getTime()).toBe(result2[0].created_at.getTime());
  });
});
