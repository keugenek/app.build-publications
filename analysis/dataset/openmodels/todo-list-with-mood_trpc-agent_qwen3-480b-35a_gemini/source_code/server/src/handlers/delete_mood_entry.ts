import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DeleteMoodEntryInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMoodEntry = async (input: DeleteMoodEntryInput): Promise<void> => {
  try {
    await db.delete(moodEntriesTable)
      .where(eq(moodEntriesTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Mood entry deletion failed:', error);
    throw error;
  }
};
