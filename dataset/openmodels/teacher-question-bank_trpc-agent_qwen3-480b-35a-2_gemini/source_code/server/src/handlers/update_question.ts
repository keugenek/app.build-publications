import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const updateQuestion = async (input: UpdateQuestionInput): Promise<Question> => {
  try {
    // First check if the question exists
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (existingQuestion.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // Check if subject exists when subject_id is provided
    if (input.subject_id !== undefined) {
      const subject = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, input.subject_id))
        .execute();
      
      if (subject.length === 0) {
        throw new Error(`Subject with id ${input.subject_id} not found`);
      }
    }

    // Check if topic exists when topic_id is provided
    if (input.topic_id !== undefined) {
      const topic = await db.select()
        .from(topicsTable)
        .where(eq(topicsTable.id, input.topic_id))
        .execute();
      
      if (topic.length === 0) {
        throw new Error(`Topic with id ${input.topic_id} not found`);
      }
    }

    // Build update data object with only provided fields
    const updateData: Partial<typeof questionsTable.$inferInsert> = {};
    
    if (input.text !== undefined) {
      updateData.text = input.text;
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.correct_answer !== undefined) {
      updateData.correct_answer = input.correct_answer;
    }
    
    if (input.subject_id !== undefined) {
      updateData.subject_id = input.subject_id;
    }
    
    if (input.topic_id !== undefined) {
      updateData.topic_id = input.topic_id;
    }

    // Update the question
    const result = await db.update(questionsTable)
      .set(updateData)
      .where(eq(questionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update question with id ${input.id}`);
    }

    // Return the updated question
    const question = result[0];
    return {
      ...question,
      created_at: new Date(question.created_at)
    };
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
};
