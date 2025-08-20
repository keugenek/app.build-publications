import { db } from '../db';
import { topicsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTopic = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the topic (cascading will handle related questions)
    const result = await db.delete(topicsTable)
      .where(eq(topicsTable.id, id))
      .returning()
      .execute();

    // Check if any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Topic deletion failed:', error);
    throw error;
  }
};
