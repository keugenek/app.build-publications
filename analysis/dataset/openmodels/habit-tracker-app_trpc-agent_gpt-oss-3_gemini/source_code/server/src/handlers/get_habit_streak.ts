// Handler to calculate the current streak of consecutive days a habit has been completed.
// It queries `habit_completions` for the given habit, considering only rows where `completed = true`,
// orders them by `date` descending, and counts consecutive days up to today.

import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { habitCompletionsTable } from '../db/schema';

export const getHabitStreak = async (habitId: number): Promise<number> => {
  // Fetch all completed habit entries for the habit, ordered by date descending
  const completions = await db
    .select()
    .from(habitCompletionsTable)
    .where(and(eq(habitCompletionsTable.habit_id, habitId), eq(habitCompletionsTable.completed, true)))
    .orderBy(desc(habitCompletionsTable.date))
    .execute();

  // Calculate streak: consecutive days up to today where completed is true
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to start of day

  let expectedDate = new Date(today);

  for (const comp of completions) {
    const compDate = new Date(comp.date);
    compDate.setHours(0, 0, 0, 0);

    if (compDate.getTime() === expectedDate.getTime()) {
      streak++;
      // Move expectedDate one day back for next iteration
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (compDate.getTime() < expectedDate.getTime()) {
      // Missing a day in the streak, stop counting
      break;
    } else {
      // Future date (should not happen), ignore
      continue;
    }
  }

  return streak;
};
