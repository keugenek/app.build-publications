import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type CreateTopicInput, type Topic } from '../schema';
import { eq } from 'drizzle-orm';

export const createTopic = async (input: CreateTopicInput): Promise<Topic> => {
  try {
    // Validate that the subject exists before creating the topic
    const subject = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.subject_id))
      .execute();

    if (subject.length === 0) {
      throw new Error(`Subject with ID ${input.subject_id} does not exist`);
    }

    // Insert topic record
    const result = await db.insert(topicsTable)
      .values({
        name: input.name,
        description: input.description || null,
        subject_id: input.subject_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Topic creation failed:', error);
    throw error;
  }
};
