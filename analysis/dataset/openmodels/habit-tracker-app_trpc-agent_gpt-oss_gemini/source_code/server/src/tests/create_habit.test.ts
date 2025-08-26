import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createHabit } from '../handlers/create_habit';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateHabitInput } from '../schema';

// Simple valid input
const validInput: CreateHabitInput = {
  name: 'Read a book',
};

describe('createHabit handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a habit and returns it', async () => {
    const habit = await createHabit(validInput);

    // Returned fields should be set correctly
    expect(habit.id).toBeGreaterThan(0);
    expect(habit.name).toBe(validInput.name);
    expect(habit.created_at).toBeInstanceOf(Date);
  });

  it('persists the habit in the database', async () => {
    const habit = await createHabit(validInput);

    const rows = await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habit.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(validInput.name);
    expect(row.id).toBe(habit.id);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
