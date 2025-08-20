import { type MarkHabitCompletionInput, type HabitCompletion } from '../schema';

/**
 * Placeholder handler to mark a habit as completed for a specific date.
 * In a real implementation this would insert into `habit_completions`.
 */
export const markHabitCompletion = async (
  input: MarkHabitCompletionInput,
): Promise<HabitCompletion> => {
  return {
    id: 0,
    habit_id: input.habit_id,
    date: input.date,
    created_at: new Date(),
  } as HabitCompletion;
};
