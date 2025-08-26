import { type HabitWithStreak } from '../schema';
import { db } from '../db/index';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const getHabit = async (id: number): Promise<HabitWithStreak | null> => {
  try {
    // First, fetch the habit to check if it exists
    const habits = await db.select().from(habitsTable).where(eq(habitsTable.id, id));
    
    if (habits.length === 0) {
      return null;
    }
    
    const habit = habits[0];
    
    // Get all completed dates for this habit using Drizzle ORM
    const completions = await db.select({ date: habitCompletionsTable.date })
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, id),
        eq(habitCompletionsTable.completed, true)
      ))
      .orderBy(habitCompletionsTable.date);
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (completions.length > 0) {
      // Convert string dates to Date objects
      const completedDates = completions.map(c => new Date(c.date));
      
      // Calculate streaks
      let maxStreak = 0;
      let currentStreakCount = 1;
      
      for (let i = 1; i < completedDates.length; i++) {
        const prev = completedDates[i - 1];
        const curr = completedDates[i];
        
        // Check if they are consecutive days
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((curr.getTime() - prev.getTime()) / oneDay));
        
        if (diffDays === 1) {
          currentStreakCount++;
        } else {
          if (currentStreakCount > maxStreak) {
            maxStreak = currentStreakCount;
          }
          currentStreakCount = 1;
        }
      }
      
      // Check the last streak
      if (currentStreakCount > maxStreak) {
        maxStreak = currentStreakCount;
      }
      
      longestStreak = maxStreak;
      
      // Calculate current streak (consecutive days ending with most recent completion)
      currentStreakCount = 1;
      for (let i = completedDates.length - 1; i > 0; i--) {
        const curr = completedDates[i];
        const prev = completedDates[i - 1];
        
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((curr.getTime() - prev.getTime()) / oneDay));
        
        if (diffDays === 1) {
          currentStreakCount++;
        } else {
          break;
        }
      }
      
      currentStreak = currentStreakCount;
    }
    
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      created_at: habit.created_at,
      current_streak: currentStreak,
      longest_streak: longestStreak
    };
  } catch (error) {
    console.error('Failed to get habit with streak:', error);
    throw error;
  }
};
