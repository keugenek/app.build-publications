import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateHabitInput = {
  name: 'Daily Exercise',
  description: 'Go for a 30-minute run or walk'
};

const minimalInput: CreateHabitInput = {
  name: 'Read Books'
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with full details', async () => {
    const result = await createHabit(testInput);

    // Basic field validation
    expect(result.name).toEqual('Daily Exercise');
    expect(result.description).toEqual('Go for a 30-minute run or walk');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a habit with only name (description optional)', async () => {
    const result = await createHabit(minimalInput);

    expect(result.name).toEqual('Read Books');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
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
    expect(habits[0].description).toEqual('Go for a 30-minute run or walk');
    expect(habits[0].created_at).toBeInstanceOf(Date);
    expect(habits[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithUndefinedDescription: CreateHabitInput = {
      name: 'Meditation',
      description: undefined
    };

    const result = await createHabit(inputWithUndefinedDescription);

    expect(result.name).toEqual('Meditation');
    expect(result.description).toBeNull();

    // Verify in database
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(habits[0].description).toBeNull();
  });

  it('should auto-generate timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createHabit(testInput);
    const afterCreation = new Date();

    // Timestamps should be between before and after creation
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Initially, created_at and updated_at should be the same
    expect(result.created_at.getTime()).toEqual(result.updated_at.getTime());
  });

  it('should create multiple habits with unique IDs', async () => {
    const habit1 = await createHabit({ name: 'Habit 1' });
    const habit2 = await createHabit({ name: 'Habit 2' });

    expect(habit1.id).not.toEqual(habit2.id);
    expect(habit1.name).toEqual('Habit 1');
    expect(habit2.name).toEqual('Habit 2');

    // Verify both exist in database
    const allHabits = await db.select()
      .from(habitsTable)
      .execute();

    expect(allHabits).toHaveLength(2);
    const names = allHabits.map(h => h.name).sort();
    expect(names).toEqual(['Habit 1', 'Habit 2']);
  });
});
