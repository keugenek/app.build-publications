import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { type ExportQuizInput } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const exportQuiz = async (input: ExportQuizInput): Promise<{ pdfData: string; filename: string }> => {
  try {
    // Fetch quiz details with questions
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (quiz.length === 0) {
      throw new Error('Quiz not found');
    }

    // Fetch questions for this quiz with proper ordering
    const quizWithQuestions = await db.select({
      question_id: quizQuestionsTable.question_id,
      question_order: quizQuestionsTable.question_order,
      question_text: questionsTable.question_text,
      option_a: questionsTable.option_a,
      option_b: questionsTable.option_b,
      option_c: questionsTable.option_c,
      option_d: questionsTable.option_d,
      correct_answer: questionsTable.correct_answer,
      explanation: questionsTable.explanation,
      difficulty_level: questionsTable.difficulty_level
    })
    .from(quizQuestionsTable)
    .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
    .where(eq(quizQuestionsTable.quiz_id, input.quiz_id))
    .orderBy(asc(quizQuestionsTable.question_order))
    .execute();

    // Generate PDF content as formatted text (simulating PDF generation)
    const pdfContent = generatePdfContent(quiz[0], quizWithQuestions, input.include_answers || false);
    
    // Convert to base64 (simulating PDF binary data)
    const pdfData = Buffer.from(pdfContent).toString('base64');
    
    // Generate filename with current date
    const dateString = new Date().toISOString().split('T')[0];
    const filename = `quiz-${input.quiz_id}-${dateString}.pdf`;

    return {
      pdfData,
      filename
    };
  } catch (error) {
    console.error('Quiz export failed:', error);
    throw error;
  }
};

function generatePdfContent(
  quiz: any,
  questions: any[],
  includeAnswers: boolean
): string {
  let content = `Quiz Export\n\n`;
  content += `Title: ${quiz.title}\n`;
  if (quiz.description) {
    content += `Description: ${quiz.description}\n`;
  }
  content += `Created: ${quiz.created_at.toDateString()}\n`;
  content += `Total Questions: ${questions.length}\n\n`;
  content += `${'='.repeat(50)}\n\n`;

  questions.forEach((q, index) => {
    content += `Question ${index + 1} (${q.difficulty_level.toUpperCase()})\n`;
    content += `${q.question_text}\n\n`;
    content += `A) ${q.option_a}\n`;
    content += `B) ${q.option_b}\n`;
    content += `C) ${q.option_c}\n`;
    content += `D) ${q.option_d}\n\n`;
    
    if (includeAnswers) {
      content += `Correct Answer: ${q.correct_answer}\n`;
      if (q.explanation) {
        content += `Explanation: ${q.explanation}\n`;
      }
      content += `\n`;
    }
    
    content += `${'-'.repeat(30)}\n\n`;
  });

  if (includeAnswers && questions.length > 0) {
    content += `\nANSWER KEY\n`;
    content += `${'='.repeat(20)}\n`;
    questions.forEach((q, index) => {
      content += `${index + 1}. ${q.correct_answer}\n`;
    });
  }

  return content;
}
