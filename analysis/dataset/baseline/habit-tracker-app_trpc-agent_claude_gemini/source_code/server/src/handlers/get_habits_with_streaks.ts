import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getHabitsWithStreaks(): Promise<HabitWithStreak[]> {
  try {
    // Get all habits
    const habits = await db.select()
      .from(habitsTable)
      .orderBy(desc(habitsTable.created_at))
      .execute();

    // Calculate streak information for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        // Get all completions for this habit, ordered by date
        const completions = await db.select()
          .from(habitCompletionsTable)
          .where(eq(habitCompletionsTable.habit_id, habit.id))
          .orderBy(desc(habitCompletionsTable.completed_at))
          .execute();

        const completionDates = completions.map(c => new Date(c.completed_at));
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        // Check if completed today
        const isCompletedToday = completionDates.some(date => {
          const completionDate = new Date(date);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate.getTime() === today.getTime();
        });

        // Calculate current streak
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        // If not completed today, start checking from yesterday
        if (!isCompletedToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Count consecutive days backwards
        while (true) {
          const hasCompletionOnDate = completionDates.some(date => {
            const completionDate = new Date(date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === checkDate.getTime();
          });

          if (hasCompletionOnDate) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Calculate longest streak by checking all possible consecutive sequences
        let longestStreak = 0;
        if (completionDates.length > 0) {
          // Sort dates in ascending order for streak calculation
          const sortedDates = [...completionDates].sort((a, b) => a.getTime() - b.getTime());
          
          let tempStreak = 1;
          let maxStreak = 1;

          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const previousDate = new Date(sortedDates[i - 1]);
            
            // Check if current date is exactly one day after previous date
            const dayDifference = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDifference === 1) {
              tempStreak++;
            } else {
              maxStreak = Math.max(maxStreak, tempStreak);
              tempStreak = 1;
            }
          }
          
          longestStreak = Math.max(maxStreak, tempStreak);
        }

        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          created_at: habit.created_at,
          updated_at: habit.updated_at,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          total_completions: completions.length,
          is_completed_today: isCompletedToday
        };
      })
    );

    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to get habits with streaks:', error);
    throw error;
  }
}
