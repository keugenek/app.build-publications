import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test input with description
const testInputWithDescription: CreateHabitInput = {
  name: 'Daily Exercise',
  description: 'Go for a 30 minute walk or run'
};

// Test input without description (null)
const testInputWithoutDescription: CreateHabitInput = {
  name: 'Drink Water',
  description: null
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with description', async () => {
    const result = await createHabit(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Daily Exercise');
    expect(result.description).toEqual('Go for a 30 minute walk or run');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit without description', async () => {
    const result = await createHabit(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Drink Water');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
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
    expect(habits[0].description).toEqual('Go for a 30 minute walk or run');
    expect(habits[0].created_at).toBeInstanceOf(Date);
    expect(habits[0].id).toEqual(result.id);
  });

  it('should save habit with null description to database', async () => {
    const result = await createHabit(testInputWithoutDescription);

    // Query using proper drizzle syntax
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toEqual('Drink Water');
    expect(habits[0].description).toBeNull();
    expect(habits[0].created_at).toBeInstanceOf(Date);
    expect(habits[0].id).toEqual(result.id);
  });

  it('should create multiple habits with unique IDs', async () => {
    const habit1 = await createHabit({
      name: 'Morning Meditation',
      description: 'Meditate for 10 minutes'
    });

    const habit2 = await createHabit({
      name: 'Read Books',
      description: null
    });

    // Verify different IDs
    expect(habit1.id).not.toEqual(habit2.id);
    expect(habit1.id).toBeGreaterThan(0);
    expect(habit2.id).toBeGreaterThan(0);

    // Verify both habits exist in database
    const habits = await db.select()
      .from(habitsTable)
      .execute();

    expect(habits).toHaveLength(2);
    
    const habit1FromDb = habits.find(h => h.id === habit1.id);
    const habit2FromDb = habits.find(h => h.id === habit2.id);

    expect(habit1FromDb).toBeDefined();
    expect(habit1FromDb!.name).toEqual('Morning Meditation');
    expect(habit1FromDb!.description).toEqual('Meditate for 10 minutes');

    expect(habit2FromDb).toBeDefined();
    expect(habit2FromDb!.name).toEqual('Read Books');
    expect(habit2FromDb!.description).toBeNull();
  });

  it('should handle created_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createHabit(testInputWithDescription);
    const afterCreate = new Date();

    // Verify timestamp is within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Verify database record has same timestamp
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});
