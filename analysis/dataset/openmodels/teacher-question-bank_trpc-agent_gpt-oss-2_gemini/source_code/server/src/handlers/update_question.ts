import { type UpdateQuestionInput, type Question } from '../schema';

/**
 * Placeholder handler for updating a question.
 * Real implementation would update the DB record identified by id.
 */
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateQuestion = async (
  input: UpdateQuestionInput,
): Promise<Question> => {
  try {
    const updates: Partial<typeof questionsTable.$inferInsert> = {};

    if (input.subject !== undefined) updates.subject = input.subject;
    if (input.topic !== undefined) updates.topic = input.topic;
    if (input.content !== undefined) updates.content = input.content;

    const result = await db
      .update(questionsTable)
      .set(updates)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    return updated as Question;
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
};
