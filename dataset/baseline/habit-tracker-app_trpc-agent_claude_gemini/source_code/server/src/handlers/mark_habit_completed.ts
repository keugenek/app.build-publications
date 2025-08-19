import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type MarkHabitCompletedInput, type HabitCompletion } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function markHabitCompleted(input: MarkHabitCompletedInput): Promise<HabitCompletion> {
  try {
    // Use provided date or default to today
    const completedAt = input.completed_at || new Date();
    
    // Format date to YYYY-MM-DD string for date column
    const completedDateStr = completedAt.toISOString().split('T')[0];

    // 1. Check if habit exists
    const habitExists = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();

    if (habitExists.length === 0) {
      throw new Error(`Habit with id ${input.habit_id} not found`);
    }

    // 2. Check if completion already exists for this habit and date
    const existingCompletion = await db.select()
      .from(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, input.habit_id),
          eq(habitCompletionsTable.completed_at, completedDateStr)
        )
      )
      .execute();

    // 3. If completion already exists, return it
    if (existingCompletion.length > 0) {
      const completion = existingCompletion[0];
      return {
        id: completion.id,
        habit_id: completion.habit_id,
        completed_at: new Date(completion.completed_at),
        created_at: completion.created_at
      };
    }

    // 4. Create new completion record
    const result = await db.insert(habitCompletionsTable)
      .values({
        habit_id: input.habit_id,
        completed_at: completedDateStr
      })
      .returning()
      .execute();

    const newCompletion = result[0];
    return {
      id: newCompletion.id,
      habit_id: newCompletion.habit_id,
      completed_at: new Date(newCompletion.completed_at),
      created_at: newCompletion.created_at
    };
  } catch (error) {
    console.error('Failed to mark habit as completed:', error);
    throw error;
  }
}
