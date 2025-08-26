import { db } from '../db';
import { questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type QuestionWithOptions } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuestionById = async (id: number): Promise<QuestionWithOptions | null> => {
  try {
    // First, get the question
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id))
      .execute();

    if (questions.length === 0) {
      return null;
    }

    const question = questions[0];

    // Then get the multiple choice options if the question has them
    let options: any[] = [];
    if (question.type === 'multiple-choice') {
      options = await db.select()
        .from(multipleChoiceOptionsTable)
        .where(eq(multipleChoiceOptionsTable.question_id, id))
        .execute();
    }

    // Return the question with its options
    return {
      ...question,
      options: options.length > 0 ? options : undefined
    };
  } catch (error) {
    console.error('Failed to get question by ID:', error);
    throw error;
  }
};
