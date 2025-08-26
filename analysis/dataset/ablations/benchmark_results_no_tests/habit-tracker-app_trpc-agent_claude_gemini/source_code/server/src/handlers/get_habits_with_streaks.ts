import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function getHabitsWithStreaks(): Promise<HabitWithStreak[]> {
  try {
    // Get all habits
    const habits = await db.select()
      .from(habitsTable)
      .orderBy(desc(habitsTable.created_at))
      .execute();

    // Calculate current streak for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const currentStreak = await calculateCurrentStreak(habit.id);
        
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          created_at: habit.created_at,
          current_streak: currentStreak
        };
      })
    );

    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to get habits with streaks:', error);
    throw error;
  }
}

async function calculateCurrentStreak(habitId: number): Promise<number> {
  // Get all completed tracking records for this habit, ordered by date desc
  const completedRecords = await db.select()
    .from(habitTrackingTable)
    .where(
      and(
        eq(habitTrackingTable.habit_id, habitId),
        eq(habitTrackingTable.completed, true)
      )
    )
    .orderBy(desc(habitTrackingTable.date))
    .execute();

  if (completedRecords.length === 0) {
    return 0;
  }

  // Calculate streak from most recent date backwards
  let streak = 0;
  let expectedDate = new Date();
  
  // Start checking from today or the most recent completion date, whichever is earlier
  const mostRecentCompletionDate = new Date(completedRecords[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  mostRecentCompletionDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // If the most recent completion is in the future, start from today
  // Otherwise, start from the most recent completion date
  expectedDate = mostRecentCompletionDate <= today ? mostRecentCompletionDate : today;

  for (const record of completedRecords) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Check if this record matches the expected date
    if (recordDate.getTime() === expectedDate.getTime()) {
      streak++;
      // Move to previous day
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (recordDate.getTime() < expectedDate.getTime()) {
      // Gap found, streak is broken
      break;
    }
    // If recordDate > expectedDate, continue (skip future dates)
  }

  return streak;
}
