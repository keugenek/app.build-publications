import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type UpdateHabitInput, type HabitWithStreak } from '../schema';

export const updateHabit = async (input: UpdateHabitInput): Promise<HabitWithStreak> => {
  try {
    // First, get the habit to ensure it exists
    const habit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .execute();

    if (habit.length === 0) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    // Get today's date (without time component for consistent comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update or insert the habit entry for today
    if (input.is_completed_today !== undefined) {
      await db.insert(habitEntriesTable)
        .values({
          habit_id: input.id,
          date: today,
          completed: input.is_completed_today
        })
        .onConflictDoUpdate({
          target: [habitEntriesTable.habit_id, habitEntriesTable.date],
          set: {
            completed: input.is_completed_today
          }
        })
        .execute();
    }

    // Get today's entry to determine is_completed_today
    const todayEntryResult = await db.select()
      .from(habitEntriesTable)
      .where(
        and(
          eq(habitEntriesTable.habit_id, input.id),
          eq(habitEntriesTable.date, today)
        )
      )
      .execute();

    const isCompletedToday = todayEntryResult.length > 0 ? todayEntryResult[0].completed : false;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;

    // Get all entries for this habit ordered by date
    const entries = await db.select()
      .from(habitEntriesTable)
      .where(eq(habitEntriesTable.habit_id, input.id))
      .orderBy(habitEntriesTable.date)
      .execute();

    // Calculate longest streak and current streak
    if (entries.length > 0) {
      // Calculate longest streak
      let maxStreak = 0;
      let currentStreakTemp = 0;
      
      for (const entry of entries) {
        if (entry.completed) {
          currentStreakTemp++;
          maxStreak = Math.max(maxStreak, currentStreakTemp);
        } else {
          currentStreakTemp = 0;
        }
      }
      longestStreak = maxStreak;
      
      // Calculate current streak (consecutive completed days ending with today)
      // Start from the most recent entry and count backwards while consecutive and completed
      let streakCount = 0;
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if today has an entry and it's completed
      const todayEntry = entries.find(e => {
        const entryDate = new Date(e.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todayEntry && todayEntry.completed) {
        // Start with today
        streakCount = 1;
        
        // Count backwards consecutive days
        for (let i = entries.length - 2; i >= 0; i--) {
          if (entries[i].completed) {
            // Check if this date is exactly one day before the previous entry
            const nextDate = new Date(entries[i + 1].date);
            nextDate.setHours(0, 0, 0, 0);
            const currentDate = new Date(entries[i].date);
            currentDate.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(nextDate);
            expectedDate.setDate(expectedDate.getDate() - 1);
            
            if (currentDate.getTime() === expectedDate.getTime()) {
              streakCount++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      } else if (!todayEntry) {
        // If there's no entry for today, check if the last entry was yesterday and completed
        const lastEntry = entries[entries.length - 1];
        if (lastEntry.completed) {
          const lastEntryDate = new Date(lastEntry.date);
          lastEntryDate.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastEntryDate.getTime() === yesterday.getTime()) {
            // Start with yesterday's completion
            streakCount = 1;
            
            // Count backwards consecutive days from yesterday
            for (let i = entries.length - 2; i >= 0; i--) {
              if (entries[i].completed) {
                // Check if this date is exactly one day before the previous entry
                const nextDate = new Date(entries[i + 1].date);
                nextDate.setHours(0, 0, 0, 0);
                const currentDate = new Date(entries[i].date);
                currentDate.setHours(0, 0, 0, 0);
                
                const expectedDate = new Date(nextDate);
                expectedDate.setDate(expectedDate.getDate() - 1);
                
                if (currentDate.getTime() === expectedDate.getTime()) {
                  streakCount++;
                } else {
                  break;
                }
              } else {
                break;
              }
            }
          }
        }
      }
      
      currentStreak = streakCount;
    }

    return {
      id: habit[0].id,
      name: habit[0].name,
      created_at: habit[0].created_at,
      is_completed_today: isCompletedToday,
      current_streak: currentStreak,
      longest_streak: longestStreak
    };
  } catch (error) {
    console.error('Habit update failed:', error);
    throw error;
  }
};
