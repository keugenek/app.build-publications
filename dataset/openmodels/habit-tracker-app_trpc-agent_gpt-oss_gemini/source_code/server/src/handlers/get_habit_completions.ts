import { type HabitCompletion } from '../schema';
import { type Habit } from '../schema';
/**
 * Placeholder handler to fetch completions for a specific habit.
 * In a real implementation this would query `habit_completions` filtered by habit_id.
 */
export const getHabitCompletions = async (habitId: number): Promise<HabitCompletion[]> => {
  // Return empty list as placeholder
  return [];
};
