import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // Validate that subject exists
    const subjectExists = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.subject_id))
      .execute();

    if (subjectExists.length === 0) {
      throw new Error(`Subject with id ${input.subject_id} does not exist`);
    }

    // Validate that topic exists and belongs to the specified subject
    const topicExists = await db.select()
      .from(topicsTable)
      .where(
        and(
          eq(topicsTable.id, input.topic_id),
          eq(topicsTable.subject_id, input.subject_id)
        )
      )
      .execute();

    if (topicExists.length === 0) {
      throw new Error(`Topic with id ${input.topic_id} does not exist or does not belong to subject ${input.subject_id}`);
    }

    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        text: input.text,
        subject_id: input.subject_id,
        topic_id: input.topic_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
