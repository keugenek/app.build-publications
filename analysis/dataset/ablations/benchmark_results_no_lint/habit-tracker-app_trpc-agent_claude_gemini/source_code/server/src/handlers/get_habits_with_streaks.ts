import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function getHabitsWithStreaks(): Promise<HabitWithStreak[]> {
  try {
    // Fetch all habits
    const habits = await db.select().from(habitsTable).execute();
    
    const habitsWithStreaks: HabitWithStreak[] = [];
    
    for (const habit of habits) {
      // Get all check-ins for this habit, ordered by completed_at descending
      const checkIns = await db.select()
        .from(habitCheckInsTable)
        .where(eq(habitCheckInsTable.habit_id, habit.id))
        .orderBy(desc(habitCheckInsTable.completed_at))
        .execute();
      
      let currentStreak = 0;
      let lastCompleted: Date | null = null;
      
      if (checkIns.length > 0) {
        lastCompleted = checkIns[0].completed_at;
        
        // Calculate current streak by counting consecutive days
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
        
        // Group check-ins by date (only the date part, not time)
        const checkInDates = new Set<string>();
        for (const checkIn of checkIns) {
          const dateStr = checkIn.completed_at.toISOString().split('T')[0];
          checkInDates.add(dateStr);
        }
        
        // Convert to sorted array of dates
        const sortedDates = Array.from(checkInDates)
          .map(dateStr => new Date(dateStr))
          .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
        
        // Calculate streak starting from the most recent date
        let currentDate = new Date(sortedDates[0]);
        currentDate.setHours(0, 0, 0, 0);
        
        for (const checkDate of sortedDates) {
          checkDate.setHours(0, 0, 0, 0);
          
          // Check if this date matches our expected current streak date
          if (checkDate.getTime() === currentDate.getTime()) {
            currentStreak++;
            // Move to the previous day
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            // Gap found, break the streak calculation
            break;
          }
        }
      }
      
      habitsWithStreaks.push({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        created_at: habit.created_at,
        current_streak: currentStreak,
        last_completed: lastCompleted
      });
    }
    
    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to get habits with streaks:', error);
    throw error;
  }
}
