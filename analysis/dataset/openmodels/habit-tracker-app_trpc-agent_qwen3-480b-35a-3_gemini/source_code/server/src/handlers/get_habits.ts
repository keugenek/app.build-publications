import { type HabitWithStreak } from '../schema';
import { db } from '../db/index';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { asc, desc, eq } from 'drizzle-orm';

export const getHabits = async (): Promise<HabitWithStreak[]> => {
  try {
    // First get all habits
    const habits = await db.select()
      .from(habitsTable)
      .orderBy(asc(habitsTable.created_at));
    
    // For each habit, calculate streaks
    const habitsWithStreaks = await Promise.all(habits.map(async (habit) => {
      // Get all completions for this habit, ordered by date descending
      const completions = await db.select()
        .from(habitCompletionsTable)
        .where(eq(habitCompletionsTable.habit_id, habit.id))
        .orderBy(desc(habitCompletionsTable.date));
      
      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      
      if (completions.length > 0) {
        // Calculate current streak - consecutive days ending with today or yesterday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        // Start checking from today or yesterday if completed
        let currentDate = null;
        
        // Check if today has a completed entry
        const todayCompletion = completions.find(c => {
          const date = new Date(c.date);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        });
        
        if (todayCompletion && todayCompletion.completed) {
          currentDate = today;
        } else {
          // Check if yesterday has a completed entry
          const yesterdayCompletion = completions.find(c => {
            const date = new Date(c.date);
            date.setHours(0, 0, 0, 0);
            return date.getTime() === yesterday.getTime();
          });
          
          if (yesterdayCompletion && yesterdayCompletion.completed) {
            currentDate = yesterday;
          }
        }
        
        // Calculate current streak by counting backwards consecutive completed days
        if (currentDate) {
          currentStreak = 1; // We already confirmed today or yesterday is completed
          let checkDate = new Date(currentDate);
          checkDate.setDate(checkDate.getDate() - 1);
          
          while (true) {
            const completion = completions.find(c => {
              const date = new Date(c.date);
              date.setHours(0, 0, 0, 0);
              return date.getTime() === checkDate.getTime();
            });
            
            if (completion && completion.completed) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
        
        // Calculate longest streak
        let tempStreak = 0;
        for (let i = completions.length - 1; i >= 0; i--) {
          if (completions[i].completed) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }
      }
      
      return {
        ...habit,
        current_streak: currentStreak,
        longest_streak: longestStreak
      };
    }));
    
    return habitsWithStreaks as HabitWithStreak[];
  } catch (error) {
    console.error('Failed to fetch habits with streaks:', error);
    throw error;
  }
};
