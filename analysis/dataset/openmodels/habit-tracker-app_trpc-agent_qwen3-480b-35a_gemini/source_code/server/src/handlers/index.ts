import { db } from '../db';
import { habitsTable, habitEntriesTable } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { type CreateHabitInput, type Habit, type UpdateHabitInput, type HabitWithStreak } from '../schema';

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    const result = await db.insert(habitsTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();
    
    const habit = result[0];
    return {
      ...habit,
      created_at: new Date(habit.created_at)
    };
  } catch (error) {
    console.error('Habit creation failed:', error);
    throw error;
  }
};

export const getHabits = async (): Promise<HabitWithStreak[]> => {
  try {
    // Get all habits
    const habits = await db.select().from(habitsTable).execute();
    
    // For each habit, calculate streak information
    const habitsWithStreak: HabitWithStreak[] = [];
    
    for (const habit of habits) {
      // Check if habit is completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEntry = await db.select()
        .from(habitEntriesTable)
        .where(and(
          eq(habitEntriesTable.habit_id, habit.id),
          gte(habitEntriesTable.date, today)
        ))
        .execute();
      
      const isCompletedToday = todayEntry.length > 0 && todayEntry[0].completed;
      
      // Calculate current streak (consecutive days including today)
      let currentStreak = 0;
      if (isCompletedToday) {
        // Count consecutive days backwards from today
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        let streakCount = 0;
        let hasBreak = false;
        
        // For simplicity, we'll calculate a basic streak
        // In a production app, this would be more complex
        const recentEntries = await db.select()
          .from(habitEntriesTable)
          .where(and(
            eq(habitEntriesTable.habit_id, habit.id),
            eq(habitEntriesTable.completed, true)
          ))
          .orderBy(sql`date DESC`)
          .execute();
        
        // Count consecutive completed days
        if (recentEntries.length > 0 && recentEntries[0].date) {
          const lastEntryDate = new Date(recentEntries[0].date);
          lastEntryDate.setHours(0, 0, 0, 0);
          
          if (lastEntryDate.getTime() === currentDate.getTime() || 
              lastEntryDate.getTime() === currentDate.getTime() - 86400000) { // Today or yesterday
            // Very basic streak calculation - in a real app this would be more robust
            streakCount = recentEntries.length;
          }
        }
        
        currentStreak = streakCount;
      }
      
      // Calculate longest streak
      const longestStreakResult = await db.select({
        maxStreak: sql`COUNT(*) as max_streak`
      })
        .from(habitEntriesTable)
        .where(and(
          eq(habitEntriesTable.habit_id, habit.id),
          eq(habitEntriesTable.completed, true)
        ))
        .execute();
        
      const longestStreak = longestStreakResult.length > 0 ? 
        parseInt(longestStreakResult[0].maxStreak as string) || 0 : 0;
      
      habitsWithStreak.push({
        id: habit.id,
        name: habit.name,
        created_at: new Date(habit.created_at),
        is_completed_today: isCompletedToday,
        current_streak: currentStreak,
        longest_streak: longestStreak
      });
    }
    
    return habitsWithStreak;
  } catch (error) {
    console.error('Get habits failed:', error);
    throw error;
  }
};

export const updateHabit = async (input: UpdateHabitInput): Promise<HabitWithStreak> => {
  try {
    // Get the habit
    const habitResult = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .execute();
    
    if (habitResult.length === 0) {
      throw new Error('Habit not found');
    }
    
    const habit = habitResult[0];
    
    if (input.is_completed_today !== undefined) {
      // Set habit entry for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Insert or update the habit entry for today
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
    
    // Return updated habit with streak information
    // Check if habit is completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEntry = await db.select()
      .from(habitEntriesTable)
      .where(and(
        eq(habitEntriesTable.habit_id, input.id),
        gte(habitEntriesTable.date, today)
      ))
      .execute();
    
    const isCompletedToday = todayEntry.length > 0 && todayEntry[0].completed;
    
    // Calculate current streak (simplified)
    let currentStreak = 0;
    if (isCompletedToday) {
      // Count consecutive completed days
      const recentEntries = await db.select()
        .from(habitEntriesTable)
        .where(and(
          eq(habitEntriesTable.habit_id, input.id),
          eq(habitEntriesTable.completed, true)
        ))
        .orderBy(sql`date DESC`)
        .execute();
      
      currentStreak = recentEntries.length;
    }
    
    // Calculate longest streak
    const longestStreakResult = await db.select({
      streak: sql`COUNT(*)`
    })
      .from(habitEntriesTable)
      .where(and(
        eq(habitEntriesTable.habit_id, input.id),
        eq(habitEntriesTable.completed, true)
      ))
      .execute();
      
    const longestStreak = longestStreakResult.length > 0 ? 
      parseInt(longestStreakResult[0].streak as string) || 0 : 0;
    
    return {
      id: habit.id,
      name: habit.name,
      created_at: new Date(habit.created_at),
      is_completed_today: isCompletedToday,
      current_streak: currentStreak,
      longest_streak: longestStreak
    };
  } catch (error) {
    console.error('Update habit failed:', error);
    throw error;
  }
};
