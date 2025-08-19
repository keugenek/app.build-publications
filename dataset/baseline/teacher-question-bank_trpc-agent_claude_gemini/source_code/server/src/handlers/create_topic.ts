import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateTopicInput, type Topic } from '../schema';

export const createTopic = async (input: CreateTopicInput): Promise<Topic> => {
  try {
    // First validate that the subject exists to prevent foreign key constraint violation
    const subject = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.subject_id))
      .execute();

    if (subject.length === 0) {
      throw new Error(`Subject with id ${input.subject_id} does not exist`);
    }

    // Insert topic record
    const result = await db.insert(topicsTable)
      .values({
        name: input.name,
        description: input.description,
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
