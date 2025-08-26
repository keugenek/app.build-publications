import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { eq, and, lte, sql } from 'drizzle-orm';

export const getHabits = async (): Promise<HabitWithStreak[]> => {
  try {
    // Get all habits
    const habits = await db.select().from(habitsTable).execute();
    
    // Get today's date for checking completion status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For each habit, get its entries and calculate streaks
    const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
      // Check if habit is completed today
      const todayEntry = await db.select()
        .from(habitEntriesTable)
        .where(and(
          eq(habitEntriesTable.habit_id, habit.id),
          eq(habitEntriesTable.date, today)
        ))
        .execute();
      
      const isCompletedToday = todayEntry.length > 0 && todayEntry[0].completed;
      
      // Calculate current streak (consecutive days including today)
      let currentStreak = 0;
      if (isCompletedToday) {
        // Start from today and count backwards while entries exist and are completed
        let currentDate = new Date(today);
        let hasEntry = true;
        
        while (hasEntry) {
          const entry = await db.select()
            .from(habitEntriesTable)
            .where(and(
              eq(habitEntriesTable.habit_id, habit.id),
              eq(habitEntriesTable.date, currentDate),
              eq(habitEntriesTable.completed, true)
            ))
            .execute();
          
          if (entry.length > 0) {
            currentStreak++;
            // Move to previous day
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            hasEntry = false;
          }
        }
      }
      
      // Calculate longest streak
      // This is more complex - we need to find the longest consecutive sequence
      let longestStreak = 0;
      
      // Get all completed entries for this habit, ordered by date
      const allEntries = await db.select()
        .from(habitEntriesTable)
        .where(and(
          eq(habitEntriesTable.habit_id, habit.id),
          eq(habitEntriesTable.completed, true)
        ))
        .orderBy(habitEntriesTable.date)
        .execute();
      
      if (allEntries.length > 0) {
        let currentSequence = 1;
        longestStreak = 1;
        
        for (let i = 1; i < allEntries.length; i++) {
          const prevDate = new Date(allEntries[i-1].date);
          const currDate = new Date(allEntries[i].date);
          
          // Check if dates are consecutive
          prevDate.setDate(prevDate.getDate() + 1);
          
          if (prevDate.getTime() === currDate.getTime()) {
            currentSequence++;
            longestStreak = Math.max(longestStreak, currentSequence);
          } else {
            currentSequence = 1;
          }
        }
        
        // Make sure longestStreak is at least 1 if there are any completed entries
        longestStreak = Math.max(longestStreak, 1);
      }
      
      return {
        id: habit.id,
        name: habit.name,
        created_at: habit.created_at,
        is_completed_today: isCompletedToday,
        current_streak: currentStreak,
        longest_streak: longestStreak
      };
    }));
    
    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to fetch habits with streaks:', error);
    throw error;
  }
};
