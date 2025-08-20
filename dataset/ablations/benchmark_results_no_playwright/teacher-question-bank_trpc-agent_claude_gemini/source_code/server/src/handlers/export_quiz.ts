import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function exportQuiz(input: GetByIdInput): Promise<string> {
  try {
    // First, fetch the quiz details
    const quizResults = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.id))
      .execute();

    if (quizResults.length === 0) {
      throw new Error(`Quiz with ID ${input.id} not found`);
    }

    const quiz = quizResults[0];

    // Fetch all questions for this quiz through the junction table
    const questionResults = await db.select({
      id: questionsTable.id,
      text: questionsTable.text
    })
      .from(quizQuestionsTable)
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizQuestionsTable.quiz_id, input.id))
      .execute();

    // Format the quiz as a printable text string
    let exportText = `Quiz: ${quiz.title}\n`;
    exportText += `Created: ${quiz.created_at.toLocaleDateString()}\n`;
    exportText += `\n`;

    if (questionResults.length === 0) {
      exportText += `This quiz contains no questions.\n`;
    } else {
      exportText += `Questions:\n`;
      questionResults.forEach((question, index) => {
        exportText += `${index + 1}. ${question.text}\n`;
      });
    }

    return exportText;
  } catch (error) {
    console.error('Quiz export failed:', error);
    throw error;
  }
}
