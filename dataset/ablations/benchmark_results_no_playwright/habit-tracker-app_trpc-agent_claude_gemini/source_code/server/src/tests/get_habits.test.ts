import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { getHabits } from '../handlers/get_habits';

// Test habit inputs
const testHabit1: CreateHabitInput = {
  name: 'Morning Exercise',
  description: 'Daily workout routine'
};

const testHabit2: CreateHabitInput = {
  name: 'Read Books',
  description: 'Read for 30 minutes daily'
};

const testHabit3: CreateHabitInput = {
  name: 'Meditate',
  description: null
};

describe('getHabits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no habits exist', async () => {
    const result = await getHabits();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all habits', async () => {
    // Create test habits
    await db.insert(habitsTable)
      .values([
        {
          name: testHabit1.name,
          description: testHabit1.description
        },
        {
          name: testHabit2.name,
          description: testHabit2.description
        }
      ])
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBeDefined();
    expect(result[0].description).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].name).toBeDefined();
    expect(result[1].description).toBeDefined();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return habits ordered by creation date (newest first)', async () => {
    // Create first habit
    await db.insert(habitsTable)
      .values({
        name: testHabit1.name,
        description: testHabit1.description
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second habit (newer)
    await db.insert(habitsTable)
      .values({
        name: testHabit2.name,
        description: testHabit2.description
      })
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(2);
    // Newer habit should be first
    expect(result[0].name).toEqual('Read Books');
    expect(result[1].name).toEqual('Morning Exercise');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle habits with null descriptions', async () => {
    // Create habit with null description
    await db.insert(habitsTable)
      .values({
        name: testHabit3.name,
        description: testHabit3.description
      })
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Meditate');
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle mixed habits with and without descriptions', async () => {
    // Create multiple habits with different description states
    await db.insert(habitsTable)
      .values([
        {
          name: testHabit1.name,
          description: testHabit1.description
        },
        {
          name: testHabit3.name,
          description: testHabit3.description // null
        }
      ])
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(2);
    
    // Find habits by name since order is by created_at
    const exerciseHabit = result.find(h => h.name === 'Morning Exercise');
    const meditateHabit = result.find(h => h.name === 'Meditate');

    expect(exerciseHabit).toBeDefined();
    expect(exerciseHabit!.description).toEqual('Daily workout routine');
    
    expect(meditateHabit).toBeDefined();
    expect(meditateHabit!.description).toBeNull();
  });

  it('should return habits with correct data types', async () => {
    // Create test habit
    await db.insert(habitsTable)
      .values({
        name: testHabit1.name,
        description: testHabit1.description
      })
      .execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    const habit = result[0];
    
    // Validate data types
    expect(typeof habit.id).toBe('number');
    expect(typeof habit.name).toBe('string');
    expect(habit.description === null || typeof habit.description === 'string').toBe(true);
    expect(habit.created_at).toBeInstanceOf(Date);
  });
});
