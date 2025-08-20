import { type CreateMoodInput, type MoodEntry } from '../schema';

/**
 * Placeholder handler to log a mood entry.
 */
export const logMood = async (input: CreateMoodInput): Promise<MoodEntry> => {
  return Promise.resolve({
    id: 0,
    date: input.date ?? new Date(),
    mood: input.mood,
    note: input.note ?? null,
    created_at: new Date(),
  });
};
