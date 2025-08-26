import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateHabitInput = {
  name: 'Exercise daily'
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit', async () => {
    const result = await createHabit(testInput);

    // Basic field validation
    expect(result.name).toEqual('Exercise daily');
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
    expect(habits[0].name).toEqual('Exercise daily');
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a habit with minimal name', async () => {
    const input: CreateHabitInput = { name: 'A' };
    const result = await createHabit(input);
    
    expect(result.name).toEqual('A');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
