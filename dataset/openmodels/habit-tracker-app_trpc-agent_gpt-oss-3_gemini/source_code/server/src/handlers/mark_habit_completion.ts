import { type MarkHabitCompletionInput, type HabitCompletion } from '../schema';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { habitCompletionsTable } from '../db/schema';

/**
 * Marks a habit as completed (or not) for a given date.
 * If a record for the habit/date already exists, it will be updated;
 * otherwise a new record is inserted.
 */
export const markHabitCompletion = async (
  input: MarkHabitCompletionInput,
): Promise<HabitCompletion> => {
  // Default to today if no date provided
  const rawDate = input.date ?? new Date();
  // Convert Date to ISO date string (YYYY-MM-DD) for the DATE column
  const date = rawDate.toISOString().split('T')[0];
  const completed = input.completed ?? true;

  try {
    // Attempt to update an existing record first
    const updateResult = await db
      .update(habitCompletionsTable)
      .set({ completed })
      .where(and(eq(habitCompletionsTable.habit_id, input.habit_id), eq(habitCompletionsTable.date, date)))
      .returning()
      .execute();

    if (updateResult.length > 0) {
      const updated = updateResult[0];
      return {
        ...updated,
        date: new Date(updated.date), // convert string back to Date
      } as HabitCompletion;
    }

    // If no rows were updated, insert a new one
    const insertResult = await db
      .insert(habitCompletionsTable)
      .values({ habit_id: input.habit_id, date, completed })
      .returning()
      .execute();

    const inserted = insertResult[0];
    return {
      ...inserted,
      date: new Date(inserted.date),
    } as HabitCompletion;
  } catch (error) {
    console.error('Failed to mark habit completion:', error);
    throw error;
  }
};
