import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateHabitInput = {
  name: 'Test Habit',
  description: 'A habit for testing'
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit', async () => {
    const result = await createHabit(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Habit');
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
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
    expect(habits[0].name).toEqual('Test Habit');
    expect(habits[0].description).toEqual(testInput.description);
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle habit with null description', async () => {
    const inputWithNullDescription: CreateHabitInput = {
      name: 'Habit with null description',
      description: null
    };

    const result = await createHabit(inputWithNullDescription);

    expect(result.name).toEqual('Habit with null description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
