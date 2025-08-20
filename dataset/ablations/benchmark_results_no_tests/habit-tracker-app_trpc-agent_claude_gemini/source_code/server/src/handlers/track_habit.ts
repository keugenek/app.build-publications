import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type TrackHabitInput, type HabitTracking } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function trackHabit(input: TrackHabitInput): Promise<HabitTracking> {
  try {
    // First, verify the habit exists
    const habit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();

    if (habit.length === 0) {
      throw new Error(`Habit with ID ${input.habit_id} not found`);
    }

    // Check if tracking entry already exists for this habit and date
    const existingTracking = await db.select()
      .from(habitTrackingTable)
      .where(
        and(
          eq(habitTrackingTable.habit_id, input.habit_id),
          eq(habitTrackingTable.date, input.date)
        )
      )
      .execute();

    let result;

    if (existingTracking.length > 0) {
      // Update existing tracking entry
      const updatedResult = await db.update(habitTrackingTable)
        .set({
          completed: input.completed
        })
        .where(eq(habitTrackingTable.id, existingTracking[0].id))
        .returning()
        .execute();
      
      result = updatedResult[0];
    } else {
      // Create new tracking entry
      const insertResult = await db.insert(habitTrackingTable)
        .values({
          habit_id: input.habit_id,
          date: input.date,
          completed: input.completed
        })
        .returning()
        .execute();
      
      result = insertResult[0];
    }

    return {
      id: result.id,
      habit_id: result.habit_id,
      date: new Date(result.date), // Convert date string to Date object
      completed: result.completed,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Habit tracking failed:', error);
    throw error;
  }
}
