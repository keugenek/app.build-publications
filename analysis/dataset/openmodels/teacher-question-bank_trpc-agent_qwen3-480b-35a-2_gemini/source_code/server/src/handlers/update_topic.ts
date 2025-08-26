import { db } from '../db';
import { topicsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateTopicInput, type Topic } from '../schema';

export const updateTopic = async (input: UpdateTopicInput): Promise<Topic> => {
  try {
    // Build the update data object with only the fields that are provided
    const updateData: Partial<typeof topicsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }

    // Update the topic record
    const result = await db.update(topicsTable)
      .set(updateData)
      .where(eq(topicsTable.id, input.id))
      .returning()
      .execute();

    // Check if any record was updated
    if (result.length === 0) {
      throw new Error(`Topic with id ${input.id} not found`);
    }

    // Return the updated topic
    return result[0];
  } catch (error) {
    console.error('Topic update failed:', error);
    throw error;
  }
};
