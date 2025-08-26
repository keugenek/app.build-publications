import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const exportQuiz = async (quizId: number): Promise<string> => {
  try {
    // Fetch the quiz
    const quizResult = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .limit(1)
      .execute();

    if (quizResult.length === 0) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    const quiz = quizResult[0];

    // Fetch questions for this quiz, ordered by quiz_questions.order
    const questionsResult = await db.select({
      id: questionsTable.id,
      text: questionsTable.text,
      correct_answer: questionsTable.correct_answer,
      order: quizQuestionsTable.order
    })
      .from(quizQuestionsTable)
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .orderBy(asc(quizQuestionsTable.order))
      .execute();

    // Format the output
    let output = `Quiz: ${quiz.name}\n`;
    output += '='.repeat(50) + '\n\n';
    
    if (questionsResult.length === 0) {
      output += 'No questions found in this quiz.\n';
    } else {
      questionsResult.forEach((question, index) => {
        output += `Question ${index + 1}: ${question.text}\n`;
        output += `Answer: ${question.correct_answer}\n\n`;
      });
    }

    return output;
  } catch (error) {
    console.error('Quiz export failed:', error);
    throw error;
  }
};
