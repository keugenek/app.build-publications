import { db } from '../db';
import { habitChecksTable, habitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateHabitCheckInput, type HabitCheck } from '../schema';

/**
 * Creates a habit check (check‑in) for a given habit.
 * Ensures the habit exists before inserting to avoid foreign‑key violations.
 * Returns the newly created habit check with proper date handling.
 */
export const createHabitCheck = async (input: CreateHabitCheckInput): Promise<HabitCheck> => {
  // Default to today if no date provided
  const checkDate = input.check_date ?? new Date();
  // Convert Date to YYYY-MM-DD string for insertion into a DATE column
  const checkDateStr = checkDate.toISOString().split('T')[0];

  // Verify that the habit exists (foreign‑key check)
  const habit = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, input.habit_id))
    .limit(1)
    .execute();

  if (habit.length === 0) {
    throw new Error(`Habit with id ${input.habit_id} does not exist`);
  }

  // Insert the habit check. The `check_date` column expects a string in YYYY‑MM‑DD format.
  const result = await db
    .insert(habitChecksTable)
    .values({
      habit_id: input.habit_id,
      check_date: checkDateStr,
      completed: true, // explicit, though default is true
    })
    .returning()
    .execute();

  const inserted = result[0];
  return {
    id: inserted.id,
    habit_id: inserted.habit_id,
    // Convert the stored string back to a Date object for the API contract
    check_date: new Date(inserted.check_date),
    completed: inserted.completed,
  } as HabitCheck;
};
