import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
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
      .where(eq(topicsTable.id, input.topic_id))
      .execute();

    if (topic.length === 0) {
      throw new Error(`Topic with id ${input.topic_id} not found`);
    }

    if (topic[0].subject_id !== input.subject_id) {
      throw new Error(`Topic ${input.topic_id} does not belong to subject ${input.subject_id}`);
    }

    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        question_text: input.question_text,
        option_a: input.option_a,
        option_b: input.option_b,
        option_c: input.option_c,
        option_d: input.option_d,
        correct_answer: input.correct_answer,
        explanation: input.explanation,
        difficulty_level: input.difficulty_level,
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
};
