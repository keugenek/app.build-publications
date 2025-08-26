import { db } from '../db';
import { habitTrackingTable } from '../db/schema';
import { type TrackHabitInput, type HabitTracking } from '../schema';
import { eq, and } from 'drizzle-orm';

export const trackHabit = async (input: TrackHabitInput): Promise<HabitTracking> => {
  try {
    // Format date as YYYY-MM-DD string for database storage
    const dateString = input.date.toISOString().split('T')[0];
    
    // Check if there's already a tracking record for this habit on this date
    const existingRecord = await db.select()
      .from(habitTrackingTable)
      .where(and(
        eq(habitTrackingTable.habit_id, input.habit_id),
        eq(habitTrackingTable.date, dateString)
      ))
      .execute();

    let resultRecord: typeof habitTrackingTable.$inferSelect;

    if (existingRecord.length > 0) {
      // Update existing record
      const result = await db.update(habitTrackingTable)
        .set({
          completed: input.completed,
          created_at: new Date() // Update timestamp
        })
        .where(eq(habitTrackingTable.id, existingRecord[0].id))
        .returning()
        .execute();
      
      resultRecord = result[0];
    } else {
      // Insert new record
      const result = await db.insert(habitTrackingTable)
        .values({
          habit_id: input.habit_id,
          date: dateString,
          completed: input.completed
        })
        .returning()
        .execute();

      resultRecord = result[0];
    }

    // Convert the result to match the HabitTracking type
    return {
      id: resultRecord.id,
      habit_id: resultRecord.habit_id,
      date: new Date(resultRecord.date), // Convert string to Date
      completed: resultRecord.completed,
      created_at: resultRecord.created_at
    };
  } catch (error) {
    console.error('Habit tracking failed:', error);
    throw error;
  }
};
