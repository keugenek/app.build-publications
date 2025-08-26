import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { asc, desc, eq } from 'drizzle-orm';

export const getHabits = async (): Promise<HabitWithStreak[]> => {
  try {
    // First, get all habits
    const habits = await db.select()
      .from(habitsTable)
      .orderBy(asc(habitsTable.id))
      .execute();

    // For each habit, calculate streaks
    const habitsWithStreaks: HabitWithStreak[] = [];
    
    for (const habit of habits) {
      // Get all tracking records for this habit, ordered by date descending
      const trackingRecords = await db.select()
        .from(habitTrackingTable)
        .where(eq(habitTrackingTable.habit_id, habit.id))
        .orderBy(desc(habitTrackingTable.date))
        .execute();

      // Convert date strings to Date objects
      const processedTrackingRecords = trackingRecords.map(record => ({
        date: new Date(record.date),
        completed: record.completed
      }));

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(processedTrackingRecords);
      
      habitsWithStreaks.push({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        created_at: habit.created_at,
        current_streak: currentStreak,
        longest_streak: longestStreak
      });
    }

    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to fetch habits with streaks:', error);
    throw error;
  }
};

// Helper function to calculate streaks from tracking records
const calculateStreaks = (trackingRecords: { date: Date; completed: boolean }[]): 
  { currentStreak: number; longestStreak: number } => {
  
  if (trackingRecords.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize and sort dates
  const normalizedRecords = trackingRecords.map(record => {
    const normalizedDate = new Date(record.date);
    normalizedDate.setHours(0, 0, 0, 0);
    return {
      date: normalizedDate,
      completed: record.completed
    };
  });
  
  // Sort by date ascending (oldest first)
  normalizedRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate longest streak
  let longestStreak = 0;
  let currentStreakLength = 0;
  
  for (let i = 0; i < normalizedRecords.length; i++) {
    if (normalizedRecords[i].completed) {
      // Check if this continues a streak from the previous day
      if (i === 0 || !isConsecutiveDays(normalizedRecords[i-1].date, normalizedRecords[i].date)) {
        // Start of a new streak
        currentStreakLength = 1;
      } else {
        // Continue the streak
        currentStreakLength++;
      }
      longestStreak = Math.max(longestStreak, currentStreakLength);
    } else {
      // Reset current streak if not completed
      currentStreakLength = 0;
    }
  }

  // Calculate current streak (consecutive completed days leading up to and including today)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a map of date -> completion status for easier lookup
  const dateMap = new Map<string, boolean>();
  normalizedRecords.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0];
    dateMap.set(dateStr, record.completed);
  });
  
  // Count consecutive completed days ending with today
  let currentDate = new Date(today);
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const completed = dateMap.get(dateStr);
    
    if (completed === true) {
      currentStreak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Either not completed or no record for this date - streak is broken
      break;
    }
  }

  return { currentStreak, longestStreak };
};

// Helper function to check if two dates are consecutive days
const isConsecutiveDays = (date1: Date, date2: Date): boolean => {
  const nextDay = new Date(date1);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.getTime() === date2.getTime();
};
