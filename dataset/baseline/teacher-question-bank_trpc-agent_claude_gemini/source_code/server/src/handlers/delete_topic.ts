import { db } from '../db';
import { topicsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export async function deleteTopic(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the topic by ID
    // The cascade delete in schema will automatically delete related questions
    const result = await db.delete(topicsTable)
      .where(eq(topicsTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Topic deletion failed:', error);
    throw error;
  }
}
