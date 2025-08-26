import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GetQuestionsInput, type Question } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getQuestions = async (input?: GetQuestionsInput): Promise<Question[]> => {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (input?.subject_id !== undefined) {
      conditions.push(eq(questionsTable.subject_id, input.subject_id));
    }

    if (input?.topic_id !== undefined) {
      conditions.push(eq(questionsTable.topic_id, input.topic_id));
    }

    if (input?.difficulty_level !== undefined) {
      conditions.push(eq(questionsTable.difficulty_level, input.difficulty_level));
    }

    // Apply pagination - use defaults if not provided
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;

    // Build and execute the query based on conditions
    let results;
    if (conditions.length > 0) {
      results = await db.select()
        .from(questionsTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .limit(limit)
        .offset(offset)
        .execute();
    } else {
      results = await db.select()
        .from(questionsTable)
        .limit(limit)
        .offset(offset)
        .execute();
    }

    // Return the results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to get questions:', error);
    throw error;
  }
};
