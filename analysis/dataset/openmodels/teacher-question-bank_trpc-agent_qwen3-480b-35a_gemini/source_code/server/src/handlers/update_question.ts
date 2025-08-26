import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // Build the update data object with only the provided fields
    const updateData: Partial<typeof questionsTable.$inferInsert> = {};
    
    if (input.question_text !== undefined) {
      updateData.question_text = input.question_text;
    }
    if (input.subject !== undefined) {
      updateData.subject = input.subject;
    }
    if (input.topic !== undefined) {
      updateData.topic = input.topic;
    }
    if (input.answer !== undefined) {
      updateData.answer = input.answer;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the question record
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // Return the updated question
    const updatedQuestion = result[0];
    return {
      ...updatedQuestion,
      created_at: updatedQuestion.created_at,
      updated_at: updatedQuestion.updated_at
    };
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
