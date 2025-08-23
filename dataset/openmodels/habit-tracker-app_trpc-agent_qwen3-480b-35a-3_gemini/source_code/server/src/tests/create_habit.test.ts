import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateHabitInput = {
  name: 'Morning Run',
  description: 'Run for 30 minutes every morning'
};

const testInputWithoutDescription: CreateHabitInput = {
  name: 'Meditation',
  description: null
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with description', async () => {
    const result = await createHabit(testInput);

    // Basic field validation
    expect(result.name).toEqual('Morning Run');
    expect(result.description).toEqual('Run for 30 minutes every morning');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit without description', async () => {
    const result = await createHabit(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Meditation');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save habit to database', async () => {
    const result = await createHabit(testInput);

    // Query the database to verify the habit was saved
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Morning Run');
    expect(habits[0].description).toEqual('Run for 30 minutes every morning');
    expect(habits[0].created_at).toBeInstanceOf(Date);
  });

  
});
