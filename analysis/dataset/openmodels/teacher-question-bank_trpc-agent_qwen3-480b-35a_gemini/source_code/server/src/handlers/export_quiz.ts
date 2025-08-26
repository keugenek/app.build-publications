import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { eq, and } from 'drizzle-orm';
import { Buffer } from 'buffer';

export const exportQuiz = async (input: GenerateQuizInput): Promise<Buffer> => {
  try {
    // First, fetch questions based on subject and topic
    const allQuestions = await db.select()
      .from(questionsTable)
      .where(and(
        eq(questionsTable.subject, input.subject),
        eq(questionsTable.topic, input.topic)
      ))
      .execute();

    // If no questions found, return empty buffer
    if (allQuestions.length === 0) {
      return Buffer.from('');
    }

    // Randomly select the requested number of questions
    const selectedQuestions = [];
    const availableQuestions = [...allQuestions];
    
    const count = Math.min(input.count, availableQuestions.length);
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      selectedQuestions.push(availableQuestions.splice(randomIndex, 1)[0]);
    }

    // Format questions for PDF export
    let pdfContent = `Quiz: ${input.subject} - ${input.topic}\n\n`;
    pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    pdfContent += '='.repeat(50) + '\n\n';

    selectedQuestions.forEach((question, index) => {
      pdfContent += `Question ${index + 1}:\n`;
      pdfContent += `${question.question_text}\n\n`;
      pdfContent += 'Answer:\n';
      pdfContent += `${question.answer}\n\n`;
      pdfContent += '-'.repeat(30) + '\n\n';
    });

    return Buffer.from(pdfContent, 'utf-8');
  } catch (error) {
    console.error('Quiz export failed:', error);
    throw error;
  }
};
