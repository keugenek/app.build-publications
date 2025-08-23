// src/handlers/get_habit_streak.ts
/**
 * Handler for calculating the current streak (consecutive days) of habit checks
 * for each habit. The streak counts how many consecutive days up to and
 * including today have a completed check. If there is no check for today, the
 * streak is 0.
 */
import { db } from "../db";
import { habitsTable, habitChecksTable } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const getHabitStreak = async (): Promise<{
  habitId: number;
  streak: number;
}[]> => {
  // Fetch all habits first
  const habits = await db.select().from(habitsTable).execute();

  const today = new Date();
  // Normalize to midnight to match the date column (which has no time component)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const results: { habitId: number; streak: number }[] = [];

  for (const habit of habits) {
    // Fetch all checks for this habit ordered by newest first
    const checks = await db
      .select()
      .from(habitChecksTable)
      .where(eq(habitChecksTable.habit_id, habit.id))
      .orderBy(desc(habitChecksTable.check_date))
      .execute();

    let streak = 0;
    // We will walk backwards day by day starting from today
    let cursorDate = new Date(todayDate);

    for (const check of checks) {
      const checkDate = new Date(check.check_date);
      // If the check date matches the cursor date, we extend the streak
      if (checkDate.getTime() === cursorDate.getTime()) {
        streak++;
        // Move cursor to previous day
        cursorDate.setDate(cursorDate.getDate() - 1);
        continue;
      }
      // If the check is for an earlier day, the current streak is broken
      if (checkDate.getTime() < cursorDate.getTime()) {
        break;
      }
      // If the check is for a future date (shouldn't happen), ignore it
    }

    results.push({ habitId: habit.id, streak });
  }

  return results;
};
