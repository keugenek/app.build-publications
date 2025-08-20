import { db } from '../db';
import { habitTrackingTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getHabitStreak(habitId: number): Promise<number> {
  try {
    // Get all tracking records for this habit, ordered by date descending (most recent first)
    const trackingRecords = await db.select()
      .from(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, habitId))
      .orderBy(desc(habitTrackingTable.date))
      .execute();

    if (trackingRecords.length === 0) {
      return 0; // No tracking records means no streak
    }

    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Start from the most recent date and work backwards
    for (const record of trackingRecords) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Check if this record is for the expected date (current date being checked)
      if (recordDate.getTime() === currentDate.getTime()) {
        if (record.completed) {
          currentStreak++;
          // Move to the previous day for next iteration
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Found an incomplete day, streak is broken
          break;
        }
      } else if (recordDate.getTime() < currentDate.getTime()) {
        // There's a gap in the dates (missing day), streak is broken
        break;
      }
      // If recordDate > currentDate, this record is for a future date, skip it
    }

    return currentStreak;
  } catch (error) {
    console.error('Failed to calculate habit streak:', error);
    throw error;
  }
}
