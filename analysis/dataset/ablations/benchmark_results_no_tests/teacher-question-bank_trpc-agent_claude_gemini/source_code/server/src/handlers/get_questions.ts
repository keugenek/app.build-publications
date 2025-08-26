import { db } from '../db';
import { questionsTable, multipleChoiceOptionsTable } from '../db/schema';
import { type QuestionWithOptions, type QuestionFilters } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getQuestions = async (filters?: QuestionFilters): Promise<QuestionWithOptions[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.subject_id !== undefined) {
      conditions.push(eq(questionsTable.subject_id, filters.subject_id));
    }

    if (filters?.topic_id !== undefined) {
      conditions.push(eq(questionsTable.topic_id, filters.topic_id));
    }

    if (filters?.type !== undefined) {
      conditions.push(eq(questionsTable.type, filters.type));
    }

    // Build and execute query
    const questions = conditions.length > 0
      ? await db.select()
          .from(questionsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(questionsTable)
          .execute();

    // Get all question IDs to fetch their options
    const questionIds = questions.map(q => q.id);
    
    // Fetch multiple choice options for all questions efficiently
    let optionsMap: Record<number, any[]> = {};
    
    if (questionIds.length > 0) {
      // Fetch all options for all questions in a single query using IN clause approach
      // Since drizzle doesn't have direct IN clause support with arrays, we'll use multiple OR conditions
      const allOptions = await Promise.all(
        questionIds.map(id => 
          db.select()
            .from(multipleChoiceOptionsTable)
            .where(eq(multipleChoiceOptionsTable.question_id, id))
            .execute()
        )
      );
      
      // Build options map
      questionIds.forEach((id, index) => {
        optionsMap[id] = allOptions[index];
      });
    }

    // Combine questions with their options
    return questions.map(question => ({
      ...question,
      options: optionsMap[question.id] || []
    }));

  } catch (error) {
    console.error('Failed to get questions:', error);
    throw error;
  }
};
