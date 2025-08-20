import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuestions(): Promise<Question[]> {
  try {
    const results = await db.select()
      .from(questionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
}

export async function getQuestionsByTopic(topicId: number): Promise<Question[]> {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch questions by topic:', error);
    throw error;
  }
}

export async function getQuestionsBySubject(subjectId: number): Promise<Question[]> {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, subjectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch questions by subject:', error);
    throw error;
  }
}
