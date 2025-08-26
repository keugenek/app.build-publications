import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const getQuestions = async (): Promise<Question[]> => {
  try {
    const results = await db.select()
      .from(questionsTable)
      .execute();

    return results.map(question => ({
      ...question,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
};

export const getQuestionsBySubject = async (subjectId: number): Promise<Question[]> => {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();

    return results.map(question => ({
      ...question,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch questions by subject:', error);
    throw error;
  }
};

export const getQuestionsByTopic = async (topicId: number): Promise<Question[]> => {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicId))
      .execute();

    return results.map(question => ({
      ...question,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch questions by topic:', error);
    throw error;
  }
};
