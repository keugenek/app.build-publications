import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    const result = await db.insert(questionsTable)
      .values({
        question_text: input.question_text,
        subject: input.subject,
        topic: input.topic,
        answer: input.answer,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
