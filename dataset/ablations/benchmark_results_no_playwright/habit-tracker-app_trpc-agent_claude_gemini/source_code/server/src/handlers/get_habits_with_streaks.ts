import { db } from '../db';
import { habitsTable, habitCheckinsTable } from '../db/schema';
import { type HabitWithStreak } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getHabitsWithStreaks(): Promise<HabitWithStreak[]> {
  try {
    // Get all habits
    const habits = await db.select()
      .from(habitsTable)
      .orderBy(desc(habitsTable.created_at))
      .execute();

    // Calculate streaks for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const checkins = await db.select()
          .from(habitCheckinsTable)
          .where(eq(habitCheckinsTable.habit_id, habit.id))
          .orderBy(desc(habitCheckinsTable.date))
          .execute();

        // Calculate current streak
        const currentStreak = calculateCurrentStreak(checkins);
        
        // Calculate longest streak
        const longestStreak = calculateLongestStreak(checkins);
        
        // Check if completed today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const completedToday = checkins.some(
          checkin => checkin.date === today && checkin.completed
        );

        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          created_at: habit.created_at,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          completed_today: completedToday
        };
      })
    );

    return habitsWithStreaks;
  } catch (error) {
    console.error('Failed to get habits with streaks:', error);
    throw error;
  }
}

function calculateCurrentStreak(checkins: { date: string; completed: boolean }[]): number {
  if (checkins.length === 0) return 0;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Sort checkins by date descending (most recent first)
  const sortedCheckins = checkins.sort((a, b) => b.date.localeCompare(a.date));

  // Check if today has a checkin and if it's completed
  const todayCheckin = sortedCheckins.find(c => c.date === todayStr);
  
  // Current streak definition:
  // - If today is explicitly marked as NOT completed, current streak is 0
  // - If today has no checkin, we can look at yesterday's streak
  // - If today is completed, count backwards from today
  
  if (todayCheckin && !todayCheckin.completed) {
    // Today was explicitly marked as not completed, so current streak is broken
    return 0;
  }
  
  let streak = 0;
  let currentDate = new Date(today);

  // Start from today if completed, otherwise start from yesterday
  if (!todayCheckin || !todayCheckin.completed) {
    // No checkin for today or not completed, start from yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive completed days going backwards
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const checkin = sortedCheckins.find(c => c.date === dateStr);

    if (checkin && checkin.completed) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // No checkin or not completed - streak ends
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(checkins: { date: string; completed: boolean }[]): number {
  if (checkins.length === 0) return 0;

  // Group consecutive completed checkins
  const completedCheckins = checkins
    .filter(c => c.completed)
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending for streak calculation

  if (completedCheckins.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedCheckins.length; i++) {
    const prevDate = new Date(completedCheckins[i - 1].date);
    const currentDate = new Date(completedCheckins[i].date);
    
    // Calculate difference in days
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap in streak, reset current streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}
