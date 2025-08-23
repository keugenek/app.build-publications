import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type MoodLog } from '../schema';

export const deleteMoodLog = async (id: number): Promise<MoodLog> => {
  try {
    const result = await db
      .delete(moodLogsTable)
      .where(eq(moodLogsTable.id, id))
      .returning()
      .execute();

    const deleted = result[0];
    if (!deleted) {
      throw new Error(`MoodLog with id ${id} not found`);
    }

    // Ensure date fields are proper Date objects
    return {
      ...deleted,
      log_date: new Date(deleted.log_date),
      created_at: new Date(deleted.created_at),
    } as MoodLog;
  } catch (error) {
    console.error('Failed to delete mood log:', error);
    throw error;
  }
};
