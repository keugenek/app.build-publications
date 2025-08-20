import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput, type QuestionWithOptions } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createQuestion = async (input: CreateQuestionInput): Promise<QuestionWithOptions> => {
  try {
    // Validate that the subject exists
    const subject = await db.select()
      .from(subjectsTable)
      .where(eq(subjectsTable.id, input.subject_id))
      .execute();

    if (subject.length === 0) {
      throw new Error(`Subject with id ${input.subject_id} not found`);
    }

    // Validate that the topic exists and belongs to the specified subject
    const topic = await db.select()
      .from(topicsTable)
      .where(
        and(
          eq(topicsTable.id, input.topic_id),
          eq(topicsTable.subject_id, input.subject_id)
        )
      )
      .execute();

    if (topic.length === 0) {
      throw new Error(`Topic with id ${input.topic_id} not found or does not belong to subject ${input.subject_id}`);
    }

    // Insert the question
    const result = await db.insert(questionsTable)
      .values({
        question_text: input.question_text,
        subject_id: input.subject_id,
        topic_id: input.topic_id,
        type: input.type,
        answer: input.answer
      })
      .returning()
      .execute();

    const question = result[0];
    
    // Return the question with empty options array for multiple-choice questions
    return {
      ...question,
      options: input.type === 'multiple-choice' ? [] : undefined
    };
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
