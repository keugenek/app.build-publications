import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // First, check if the question exists
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingQuestion.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // If subject_id is being updated, validate it exists
    if (input.subject_id !== undefined) {
      const subject = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, input.subject_id))
        .limit(1)
        .execute();

      if (subject.length === 0) {
        throw new Error(`Subject with id ${input.subject_id} not found`);
      }
    }

    // If topic_id is being updated, validate it exists
    if (input.topic_id !== undefined) {
      const topic = await db.select()
        .from(topicsTable)
        .where(eq(topicsTable.id, input.topic_id))
        .limit(1)
        .execute();

      if (topic.length === 0) {
        throw new Error(`Topic with id ${input.topic_id} not found`);
      }
    }

    // Build the update object with only the provided fields
    const updateData: Partial<typeof questionsTable.$inferInsert> = {};
    
    if (input.text !== undefined) {
      updateData.text = input.text;
    }
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }
    if (input.topic_id !== undefined) {
      updateData.topic_id = input.topic_id;
    }

    // If no fields to update, return the existing question
    if (Object.keys(updateData).length === 0) {
      return existingQuestion[0];
    }

    // Update the question record
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
