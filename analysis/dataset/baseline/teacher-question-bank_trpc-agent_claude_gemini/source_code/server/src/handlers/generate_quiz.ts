import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type GenerateQuizInput, type QuizWithQuestions } from '../schema';
import { eq, and, inArray, SQL } from 'drizzle-orm';

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizWithQuestions> {
  try {
    // 1. Create a new quiz record with title and description
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: input.title,
        description: input.description
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // 2. Build query to find questions matching the specified criteria
    const conditions: SQL<unknown>[] = [];

    // Filter by subject IDs (required)
    conditions.push(inArray(questionsTable.subject_id, input.subject_ids));

    // Filter by topic IDs (optional)
    if (input.topic_ids && input.topic_ids.length > 0) {
      conditions.push(inArray(questionsTable.topic_id, input.topic_ids));
    }

    // Filter by difficulty levels (optional)
    if (input.difficulty_levels && input.difficulty_levels.length > 0) {
      conditions.push(inArray(questionsTable.difficulty_level, input.difficulty_levels));
    }

    // Build and execute query
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
    const availableQuestions = await db.select()
      .from(questionsTable)
      .where(whereCondition)
      .execute();

    if (availableQuestions.length === 0) {
      throw new Error('No questions found matching the specified criteria');
    }

    // 3. Randomly select the requested number of questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(input.question_count, shuffled.length));

    // 4. Create quiz-question associations with proper ordering
    if (selectedQuestions.length > 0) {
      const quizQuestionValues = selectedQuestions.map((question, index) => ({
        quiz_id: quiz.id,
        question_id: question.id,
        question_order: index + 1
      }));

      await db.insert(quizQuestionsTable)
        .values(quizQuestionValues)
        .execute();
    }

    // 5. Return the complete quiz with all selected questions
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      created_at: quiz.created_at,
      questions: selectedQuestions
    };
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
}
