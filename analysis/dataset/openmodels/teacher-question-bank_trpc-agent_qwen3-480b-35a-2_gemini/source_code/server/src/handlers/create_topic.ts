import { db } from '../db';
import { topicsTable } from '../db/schema';
import { type CreateTopicInput, type Topic } from '../schema';

export const createTopic = async (input: CreateTopicInput): Promise<Topic> => {
  try {
    // Insert topic record
    const result = await db.insert(topicsTable)
      .values({
        name: input.name,
        subject_id: input.subject_id
      })
      .returning()
      .execute();

    const topic = result[0];
    return {
      ...topic,
      id: topic.id,
      subject_id: topic.subject_id,
      created_at: topic.created_at
    };
  } catch (error) {
    console.error('Topic creation failed:', error);
    throw error;
  }
};
