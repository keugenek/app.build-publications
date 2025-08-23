import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        text: input.text,
        type: input.type,
        correct_answer: input.correct_answer,
        subject_id: input.subject_id,
        topic_id: input.topic_id
      })
      .returning()
      .execute();

    // Return the created question
    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
