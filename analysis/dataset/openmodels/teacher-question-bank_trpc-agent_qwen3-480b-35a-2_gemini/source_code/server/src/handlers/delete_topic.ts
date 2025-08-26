import { db } from '../db';
import { topicsTable, questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTopic = async (id: number): Promise<boolean> => {
  try {
    // First check if the topic exists
    const existingTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, id))
      .limit(1)
      .execute();

    if (existingTopic.length === 0) {
      return false; // Topic not found
    }

    // Check if there are any questions associated with this topic
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, id))
      .limit(1)
      .execute();

    // If there are questions associated with this topic, we should not delete it
    // to maintain referential integrity
    if (questions.length > 0) {
      throw new Error('Cannot delete topic with associated questions');
    }

    // Perform the deletion
    const result = await db.delete(topicsTable)
      .where(eq(topicsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Topic deletion failed:', error);
    throw error;
  }
};
