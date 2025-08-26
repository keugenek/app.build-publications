import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type Question } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateQuestion(input: UpdateQuestionInput): Promise<Question> {
  try {
    // First, verify the question exists
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.id))
      .execute();

    if (existingQuestion.length === 0) {
      throw new Error(`Question with id ${input.id} not found`);
    }

    // If subject_id is being updated, verify it exists
    if (input.subject_id !== undefined) {
      const subject = await db.select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, input.subject_id))
        .execute();

      if (subject.length === 0) {
        throw new Error(`Subject with id ${input.subject_id} not found`);
      }
    }

    // If topic_id is being updated, verify it exists and belongs to the correct subject
    if (input.topic_id !== undefined) {
      const topicSubjectId = input.subject_id !== undefined ? input.subject_id : existingQuestion[0].subject_id;
      
      const topic = await db.select()
        .from(topicsTable)
        .where(and(
          eq(topicsTable.id, input.topic_id),
          eq(topicsTable.subject_id, topicSubjectId)
        ))
        .execute();

      if (topic.length === 0) {
        throw new Error(`Topic with id ${input.topic_id} not found or does not belong to subject ${topicSubjectId}`);
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof questionsTable.$inferInsert> = {};
    
    if (input.question_text !== undefined) {
      updateData.question_text = input.question_text;
    }
    
    if (input.answer_text !== undefined) {
      updateData.answer_text = input.answer_text;
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

    return result[0];
  } catch (error) {
    console.error('Question update failed:', error);
    throw error;
  }
}
