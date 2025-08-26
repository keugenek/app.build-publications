import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // Build the update object with only the fields that are provided
    const updateData: any = {};
    
    if (input.text !== undefined) {
      updateData.text = input.text;
    }
    
    if (input.answer !== undefined) {
      updateData.answer = input.answer;
    }
    
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }
    
    if (input.topic_id !== undefined) {
      updateData.topic_id = input.topic_id;
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
    
    // Convert numeric fields back to numbers before returning
    const question = result[0];
    return {
      ...question,
      subject_id: question.subject_id,
      topic_id: question.topic_id
    };
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
