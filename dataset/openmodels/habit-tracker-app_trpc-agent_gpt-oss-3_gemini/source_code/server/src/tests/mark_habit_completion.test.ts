import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { markHabitCompletion } from '../handlers/mark_habit_completion';
import { eq, and } from 'drizzle-orm';

// Helper to create a habit and return its id
const createHabit = async (name: string, description?: string | null) => {
  const result = await db
    .insert(habitsTable)
    .values({ name, description })
    .returning()
    .execute();
  return result[0].id;
};

describe('markHabitCompletion handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('inserts a new completion when none exists', async () => {
    const habitId = await createHabit('Read a book');
    const today = new Date();

    const result = await markHabitCompletion({ habit_id: habitId, date: today, completed: true });

    // Verify returned object
    expect(result.id).toBeGreaterThan(0);
    expect(result.habit_id).toBe(habitId);
    expect(result.completed).toBe(true);
    expect(result.date.toDateString()).toBe(today.toDateString());

    // Verify persisted in DB
    const rows = await db
      .select()
      .from(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, habitId))
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(true);
    expect(new Date(rows[0].date).toDateString()).toBe(today.toDateString());
  });

  it('updates an existing completion', async () => {
    const habitId = await createHabit('Exercise');
    const date = new Date('2024-01-01');

    // Insert initial completion manually
    await db
      .insert(habitCompletionsTable)
      .values({ habit_id: habitId, date: date.toISOString().split('T')[0], completed: false })
      .execute();

    // Now call handler to set completed true
    const result = await markHabitCompletion({ habit_id: habitId, date, completed: true });

    expect(result.completed).toBe(true);
    expect(result.habit_id).toBe(habitId);
    expect(result.date.toDateString()).toBe(date.toDateString());

    // Verify DB reflects update
    const dateStr = date.toISOString().split('T')[0];
    const rows = await db
      .select()
      .from(habitCompletionsTable)
      .where(and(eq(habitCompletionsTable.habit_id, habitId), eq(habitCompletionsTable.date, dateStr)))
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(true);
  });
});
