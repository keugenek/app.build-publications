import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  try {
    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        question_text: input.question_text,
        answer_text: input.answer_text,
        subject_id: input.subject_id,
        topic_id: input.topic_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
}
