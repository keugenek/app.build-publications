import { type GenerateQuizInput, type Question, type Quiz } from '../schema';

/**
 * Placeholder handler for generating a quiz.
 * In a real implementation this would select random questions from the DB.
 */
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { questionsTable } from '../db/schema';

/**
 * Generates a quiz by selecting random questions matching the given subject and topic.
 * The number of questions returned is limited by `input.count`.
 */
export const generateQuiz = async (
  input: GenerateQuizInput,
): Promise<Quiz> => {
  // Fetch all matching questions
  const matching = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.subject, input.subject),
        eq(questionsTable.topic, input.topic)
      )
    )
    .execute();

  // Shuffle the array for random selection
  const shuffled = matching.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, input.count);

  // Map database rows to the Question type expected by the schema
  const questions: Question[] = selected.map((q) => ({
    id: q.id,
    subject: q.subject,
    topic: q.topic,
    content: q.content,
    created_at: q.created_at,
  }));

  return {
    id: Date.now(), // generate a simple unique ID for the quiz
    subject: input.subject,
    topic: input.topic,
    questions,
    created_at: new Date(),
  } as Quiz;
};
