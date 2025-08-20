import { db } from '../db';
import { questionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type GetQuestionsBySubjectTopicInput, type Question } from '../schema';

export const getQuestionsBySubjectTopic = async (input: GetQuestionsBySubjectTopicInput): Promise<Question[]> => {
  try {
    const conditions = [
      eq(questionsTable.subject, input.subject),
      eq(questionsTable.topic, input.topic)
    ];

    const results = await db.select()
      .from(questionsTable)
      .where(and(...conditions))
      .execute();

    // Convert results to proper Question type (no numeric conversions needed for this schema)
    return results.map(question => ({
      ...question,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch questions by subject and topic:', error);
    throw error;
  }
};
