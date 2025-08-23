import { type CreateMoodEntryInput, type MoodEntry } from '../schema';

/**
 * Placeholder handler for creating a mood entry.
 */
export const createMoodEntry = async (input: CreateMoodEntryInput): Promise<MoodEntry> => {
  return {
    id: 0,
    date: input.date,
    rating: input.rating,
    note: input.note ?? null,
    created_at: new Date(),
  } as MoodEntry;
};
