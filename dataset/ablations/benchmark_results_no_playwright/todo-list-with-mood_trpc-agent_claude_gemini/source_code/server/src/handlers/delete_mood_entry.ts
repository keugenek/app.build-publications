import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DeleteMoodEntryInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMoodEntry = async (input: DeleteMoodEntryInput): Promise<{ success: boolean }> => {
  try {
    // Delete the mood entry by ID
    const result = await db.delete(moodEntriesTable)
      .where(eq(moodEntriesTable.id, input.id))
      .execute();

    // Check if any rows were affected (i.e., if the mood entry existed)
    return { success: (result.rowCount || 0) > 0 };
  } catch (error) {
    console.error('Mood entry deletion failed:', error);
    throw error;
  }
};
