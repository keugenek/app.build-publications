import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateQuestionInput, type Question } from '../schema';

/**
 * Update a question record in the database.
 * The input may contain any subset of fields to update; fields not provided retain their existing values.
 * Returns the updated question.
 */
export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // Fetch current question to preserve unchanged fields
    const existingResults = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    const existing = existingResults[0];
    if (!existing) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // Build update payload, falling back to existing values when a field is undefined
    const updated = await db
      .update(questionsTable)
      .set({
        subject: input.subject ?? existing.subject,
        topic: input.topic ?? existing.topic,
        question_text: input.question_text ?? existing.question_text,
        answer_text: input.answer_text ?? existing.answer_text,
      })
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    // returning() yields an array; we return the first element
    return updated[0] as Question;
  } catch (error) {
    console.error('Failed to update question:', error);
    throw error;
  }
};
