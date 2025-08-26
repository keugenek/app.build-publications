import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteActivityLog = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the activity log by ID
    const result = await db.delete(activityLogsTable)
      .where(eq(activityLogsTable.id, id))
      .returning()
      .execute();

    // Check if any record was deleted
    if (result.length === 0) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Activity log deletion failed:', error);
    throw error;
  }
};
