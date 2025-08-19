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

  it('should return all habits', async () => {
    // Create test habits
    await db.insert(habitsTable).values([
      {
        name: 'Exercise',
        description: 'Daily workout routine'
      },
      {
        name: 'Reading',
        description: 'Read for 30 minutes'
      },
      {
        name: 'Meditation',
        description: null // Test nullable description
      }
    ]).execute();

    const result = await getHabits();

    expect(result).toHaveLength(3);
    
    // Verify all habits are returned with correct structure
    expect(result[0].id).toBeDefined();
    expect(result[0].name).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return habits ordered by name', async () => {
    // Insert habits in random order
    await db.insert(habitsTable).values([
      {
        name: 'Zettelkasten',
        description: 'Note taking system'
      },
      {
        name: 'Yoga',
        description: 'Daily yoga practice'
      },
      {
        name: 'Breakfast',
        description: 'Healthy breakfast'
      }
    ]).execute();

    const result = await getHabits();

    // Should be ordered alphabetically by name
    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Breakfast');
    expect(result[1].name).toEqual('Yoga');
    expect(result[2].name).toEqual('Zettelkasten');
  });

  it('should handle habits with null descriptions', async () => {
    // Create habit with null description
    await db.insert(habitsTable).values({
      name: 'Test Habit',
      description: null
    }).execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Habit');
    expect(result[0].description).toBeNull();
  });

  it('should return habits with all required fields', async () => {
    await db.insert(habitsTable).values({
      name: 'Complete Habit',
      description: 'A fully specified habit'
    }).execute();

    const result = await getHabits();

    expect(result).toHaveLength(1);
    const habit = result[0];

    // Verify all schema fields are present
    expect(typeof habit.id).toBe('number');
    expect(typeof habit.name).toBe('string');
    expect(habit.description === null || typeof habit.description === 'string').toBe(true);
    expect(habit.created_at).toBeInstanceOf(Date);
    expect(habit.updated_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(habit.name).toEqual('Complete Habit');
    expect(habit.description).toEqual('A fully specified habit');
  });

  it('should handle large number of habits', async () => {
    // Create multiple habits
    const habitsToCreate = Array.from({ length: 10 }, (_, i) => ({
      name: `Habit ${i + 1}`,
      description: `Description for habit ${i + 1}`
    }));

    await db.insert(habitsTable).values(habitsToCreate).execute();

    const result = await getHabits();

    expect(result).toHaveLength(10);
    
    // Verify ordering is maintained
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].name.localeCompare(result[i + 1].name)).toBeLessThanOrEqual(0);
    }
  });
});
