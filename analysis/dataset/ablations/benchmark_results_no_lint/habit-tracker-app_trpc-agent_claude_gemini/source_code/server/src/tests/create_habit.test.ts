import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputWithDescription: CreateHabitInput = {
  name: 'Daily Exercise',
  description: 'Go for a 30-minute run or workout'
};

// Test input with minimal required fields
const testInputMinimal: CreateHabitInput = {
  name: 'Read Books'
  // description is optional
};

// Test input with explicit null description
const testInputNullDescription: CreateHabitInput = {
  name: 'Meditation',
  description: null
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with description', async () => {
    const result = await createHabit(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Daily Exercise');
    expect(result.description).toEqual('Go for a 30-minute run or workout');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit without description', async () => {
    const result = await createHabit(testInputMinimal);

    // Basic field validation
    expect(result.name).toEqual('Read Books');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle explicit null description', async () => {
    const result = await createHabit(testInputNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Meditation');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save habit to database', async () => {
    const result = await createHabit(testInputWithDescription);

    // Query using proper drizzle syntax
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Daily Exercise');
    expect(habits[0].description).toEqual('Go for a 30-minute run or workout');
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple habits with unique IDs', async () => {
    const result1 = await createHabit({ name: 'Habit 1', description: 'First habit' });
    const result2 = await createHabit({ name: 'Habit 2', description: 'Second habit' });

    // Check that IDs are different
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Habit 1');
    expect(result2.name).toEqual('Habit 2');

    // Verify both are in database
    const allHabits = await db.select()
      .from(habitsTable)
      .execute();

    expect(allHabits).toHaveLength(2);
  });

  it('should handle created_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createHabit(testInputWithDescription);
    const afterCreate = new Date();

    // Check that created_at is within reasonable time range
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
