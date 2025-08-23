import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteMoodLog = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(moodLogsTable)
      .where(eq(moodLogsTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Mood log deletion failed:', error);
    throw error;
  }
};
