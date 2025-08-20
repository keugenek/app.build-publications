import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GenerateQuizInput, type Question } from '../schema';
import { eq, and } from 'drizzle-orm';

export const generateQuiz = async (input: GenerateQuizInput): Promise<Question[]> => {
  try {
    // Query questions filtered by subject and topic
    const matchingQuestions = await db.select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.subject, input.subject),
          eq(questionsTable.topic, input.topic)
        )
      )
      .execute();

    // If we don't have enough questions, return all matching questions
    if (matchingQuestions.length <= input.count) {
      return matchingQuestions.map(question => ({
        ...question,
        created_at: new Date(question.created_at),
        updated_at: new Date(question.updated_at)
      }));
    }

    // If we have more questions than needed, randomly select the required count
    const selectedQuestions: typeof matchingQuestions = [];
    const availableQuestions = [...matchingQuestions];
    
    for (let i = 0; i < input.count; i++) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      selectedQuestions.push(availableQuestions.splice(randomIndex, 1)[0]);
    }

    return selectedQuestions.map(question => ({
      ...question,
      created_at: new Date(question.created_at),
      updated_at: new Date(question.updated_at)
    }));
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
};
