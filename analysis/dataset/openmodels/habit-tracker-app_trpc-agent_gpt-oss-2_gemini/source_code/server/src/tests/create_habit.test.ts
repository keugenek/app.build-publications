import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput } from '../schema';
import { createHabit } from '../handlers/create_habit';
import { eq } from 'drizzle-orm';

// Test input with description
const testInput: CreateHabitInput = {
  name: 'Read a book',
  description: 'Read a new book every week',
};

// Test input without description (null)
const testInputNull: CreateHabitInput = {
  name: 'Meditate',
  description: null,
};

describe('createHabit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a habit with description', async () => {
    const result = await createHabit(testInput);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInput.name);
    expect(result.description).toBe(testInput.description);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a habit with null description', async () => {
    const result = await createHabit(testInputNull);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(testInputNull.name);
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist habit in database', async () => {
    const result = await createHabit(testInput);

    const records = await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    const habit = records[0];
    expect(habit.name).toBe(testInput.name);
    expect(habit.description).toBe(testInput.description);
    expect(habit.created_at).toBeInstanceOf(Date);
  });
});
