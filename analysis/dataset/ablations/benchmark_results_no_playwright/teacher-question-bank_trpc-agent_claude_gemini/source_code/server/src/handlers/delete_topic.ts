import { db } from '../db';
import { topicsTable, questionsTable } from '../db/schema';
import { type DeleteTopicInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTopic(input: DeleteTopicInput): Promise<{ success: boolean }> {
  try {
    // First, delete all questions related to this topic (cascade deletion)
    await db.delete(questionsTable)
      .where(eq(questionsTable.topic_id, input.id))
      .execute();

    // Then delete the topic itself
    const result = await db.delete(topicsTable)
      .where(eq(topicsTable.id, input.id))
      .returning()
      .execute();

    // Check if a topic was actually deleted
    if (result.length === 0) {
      throw new Error(`Topic with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Topic deletion failed:', error);
    throw error;
  }
}
