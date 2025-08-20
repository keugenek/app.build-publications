import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GetQuestionsByFiltersInput, type Question } from '../schema';
import { and, inArray, type SQL } from 'drizzle-orm';

export async function getQuestionsByFilters(input: GetQuestionsByFiltersInput): Promise<Question[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by subject IDs if provided
    if (input.subject_ids && input.subject_ids.length > 0) {
      conditions.push(inArray(questionsTable.subject_id, input.subject_ids));
    }

    // Filter by topic IDs if provided
    if (input.topic_ids && input.topic_ids.length > 0) {
      conditions.push(inArray(questionsTable.topic_id, input.topic_ids));
    }

    // Execute query based on whether we have conditions and limit
    let results;

    if (conditions.length === 0) {
      // No filters - return all questions with optional limit
      if (input.limit) {
        results = await db.select().from(questionsTable).limit(input.limit).execute();
      } else {
        results = await db.select().from(questionsTable).execute();
      }
    } else {
      // Apply filters with optional limit
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      if (input.limit) {
        results = await db.select()
          .from(questionsTable)
          .where(whereCondition)
          .limit(input.limit)
          .execute();
      } else {
        results = await db.select()
          .from(questionsTable)
          .where(whereCondition)
          .execute();
      }
    }

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to get questions by filters:', error);
    throw error;
  }
}
