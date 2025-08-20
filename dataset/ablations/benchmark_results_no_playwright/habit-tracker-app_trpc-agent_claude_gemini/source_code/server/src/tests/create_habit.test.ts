import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testInput: CreateHabitInput = {
  name: 'Daily Exercise',
  description: 'Go for a 30-minute walk every day'
};

const testInputWithoutDescription: CreateHabitInput = {
  name: 'Read Books'
  // description is optional
};

const testInputWithNullDescription: CreateHabitInput = {
  name: 'Meditation',
  description: null
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with description', async () => {
    const result = await createHabit(testInput);

    // Basic field validation
    expect(result.name).toEqual('Daily Exercise');
    expect(result.description).toEqual('Go for a 30-minute walk every day');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit without description', async () => {
    const result = await createHabit(testInputWithoutDescription);

    // Validate fields
    expect(result.name).toEqual('Read Books');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit with null description', async () => {
    const result = await createHabit(testInputWithNullDescription);

    // Validate fields
    expect(result.name).toEqual('Meditation');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save habit to database', async () => {
    const result = await createHabit(testInput);

    // Query using proper drizzle syntax
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Daily Exercise');
    expect(habits[0].description).toEqual('Go for a 30-minute walk every day');
    expect(habits[0].id).toEqual(result.id);
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple habits', async () => {
    const habit1 = await createHabit({ name: 'Habit 1' });
    const habit2 = await createHabit({ name: 'Habit 2' });

    expect(habit1.id).not.toEqual(habit2.id);
    expect(habit1.id).toBeGreaterThan(0);
    expect(habit2.id).toBeGreaterThan(0);
  });

  it('should persist multiple habits in database', async () => {
    await createHabit({ name: 'Morning Routine' });
    await createHabit({ name: 'Evening Routine', description: 'Wind down activities' });

    const allHabits = await db.select()
      .from(habitsTable)
      .execute();

    expect(allHabits).toHaveLength(2);
    
    const morningHabit = allHabits.find(h => h.name === 'Morning Routine');
    const eveningHabit = allHabits.find(h => h.name === 'Evening Routine');
    
    expect(morningHabit).toBeDefined();
    expect(morningHabit?.description).toBeNull();
    
    expect(eveningHabit).toBeDefined();
    expect(eveningHabit?.description).toEqual('Wind down activities');
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createHabit(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });
});
