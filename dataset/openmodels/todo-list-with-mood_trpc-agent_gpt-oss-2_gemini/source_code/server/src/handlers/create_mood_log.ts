import { type CreateMoodLogInput, type MoodLog } from '../schema';

export const createMoodLog = async (input: CreateMoodLogInput): Promise<MoodLog> => {
  // Placeholder: In real implementation, insert mood log into DB and return created record
  return {
    id: 0,
    mood: input.mood,
    log_date: input.log_date,
    note: input.note ?? null,
    created_at: new Date(),
  } as MoodLog;
};
