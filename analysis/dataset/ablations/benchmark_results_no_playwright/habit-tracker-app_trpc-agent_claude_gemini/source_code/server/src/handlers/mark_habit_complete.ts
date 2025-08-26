import { db } from '../db';
import { habitsTable, habitCheckinsTable } from '../db/schema';
import { type MarkHabitCompleteInput, type HabitCheckin } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function markHabitComplete(input: MarkHabitCompleteInput): Promise<HabitCheckin> {
  try {
    // First, verify that the habit exists
    const habit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();

    if (habit.length === 0) {
      throw new Error(`Habit with id ${input.habit_id} does not exist`);
    }

    // Check if a checkin already exists for this habit and date
    const existingCheckin = await db.select()
      .from(habitCheckinsTable)
      .where(
        and(
          eq(habitCheckinsTable.habit_id, input.habit_id),
          eq(habitCheckinsTable.date, input.date)
        )
      )
      .execute();

    let result;

    if (existingCheckin.length > 0) {
      // Update existing checkin
      const updateResult = await db.update(habitCheckinsTable)
        .set({
          completed: input.completed
        })
        .where(eq(habitCheckinsTable.id, existingCheckin[0].id))
        .returning()
        .execute();

      result = updateResult[0];
    } else {
      // Create new checkin record
      const insertResult = await db.insert(habitCheckinsTable)
        .values({
          habit_id: input.habit_id,
          date: input.date,
          completed: input.completed
        })
        .returning()
        .execute();

      result = insertResult[0];
    }

    // Convert date string to Date object to match schema
    return {
      ...result,
      date: new Date(result.date)
    };
  } catch (error) {
    console.error('Mark habit complete failed:', error);
    throw error;
  }
}
