import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type UpdateTopicInput, type Topic } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTopic = async (input: UpdateTopicInput): Promise<Topic> => {
  try {
    // First, check if the topic exists
    const existingTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, input.id))
      .execute();

    if (existingTopic.length === 0) {
      throw new Error(`Topic with id ${input.id} not found`);
    }

    // If subject_id is being updated, verify the subject exists
    if (input.subject_id !== undefined) {
      const subjectExists = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, input.subject_id))
        .execute();

      if (subjectExists.length === 0) {
        throw new Error(`Subject with id ${input.subject_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: { name?: string; subject_id?: number } = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }

    // If no fields to update, return the existing topic
    if (Object.keys(updateData).length === 0) {
      return existingTopic[0];
    }

    // Update the topic
    const result = await db.update(topicsTable)
      .set(updateData)
      .where(eq(topicsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Topic update failed:', error);
    throw error;
  }
};
