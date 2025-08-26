import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable, multipleChoiceOptionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type ExportQuizToPdfInput } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const exportQuizToPdf = async (input: ExportQuizToPdfInput): Promise<{ pdfUrl: string }> => {
  try {
    // First, verify the quiz exists
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (quiz.length === 0) {
      throw new Error(`Quiz with ID ${input.quiz_id} not found`);
    }

    // Fetch quiz questions with full question details, subject, topic, and options
    const quizData = await db.select({
      quiz_id: quizQuestionsTable.quiz_id,
      quiz_title: quizzesTable.title,
      quiz_description: quizzesTable.description,
      order_index: quizQuestionsTable.order_index,
      question_id: questionsTable.id,
      question_text: questionsTable.question_text,
      question_type: questionsTable.type,
      question_answer: questionsTable.answer,
      subject_name: subjectsTable.name,
      topic_name: topicsTable.name
    })
    .from(quizQuestionsTable)
    .innerJoin(quizzesTable, eq(quizQuestionsTable.quiz_id, quizzesTable.id))
    .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
    .innerJoin(subjectsTable, eq(questionsTable.subject_id, subjectsTable.id))
    .innerJoin(topicsTable, eq(questionsTable.topic_id, topicsTable.id))
    .where(eq(quizQuestionsTable.quiz_id, input.quiz_id))
    .orderBy(asc(quizQuestionsTable.order_index))
    .execute();

    if (quizData.length === 0) {
      throw new Error(`No questions found for quiz ID ${input.quiz_id}`);
    }

    // Fetch multiple choice options for all questions in the quiz
    const questionIds = quizData.map(q => q.question_id);
    const options = await db.select()
      .from(multipleChoiceOptionsTable)
      .where(eq(multipleChoiceOptionsTable.question_id, questionIds[0]))
      .execute();

    // Get all options for all questions at once
    const allOptions = await db.select()
      .from(multipleChoiceOptionsTable)
      .execute();

    const optionsByQuestion = allOptions
      .filter(option => questionIds.includes(option.question_id))
      .reduce((acc, option) => {
        if (!acc[option.question_id]) {
          acc[option.question_id] = [];
        }
        acc[option.question_id].push(option);
        return acc;
      }, {} as Record<number, typeof allOptions>);

    // Generate PDF content (simplified HTML-like structure for demonstration)
    const quizTitle = quizData[0].quiz_title;
    const quizDescription = quizData[0].quiz_description;
    
    let pdfContent = `Quiz: ${quizTitle}\n`;
    if (quizDescription) {
      pdfContent += `Description: ${quizDescription}\n`;
    }
    pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    // Add questions
    quizData.forEach((questionData, index) => {
      pdfContent += `Question ${index + 1}: ${questionData.question_text}\n`;
      pdfContent += `Subject: ${questionData.subject_name} | Topic: ${questionData.topic_name}\n`;
      pdfContent += `Type: ${questionData.question_type}\n`;

      // Add multiple choice options if applicable
      if (questionData.question_type === 'multiple-choice') {
        const questionOptions = optionsByQuestion[questionData.question_id] || [];
        questionOptions.forEach((option, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...
          pdfContent += `  ${letter}) ${option.option_text}\n`;
        });
      }

      // Add answer if requested
      if (input.include_answers) {
        pdfContent += `Answer: ${questionData.question_answer}\n`;
      }

      pdfContent += '\n';
    });

    // In a real implementation, this would generate an actual PDF file
    // and store it in a file system or cloud storage, then return the URL
    // For now, we'll simulate this with a generated filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `quiz-${input.quiz_id}-${timestamp}.pdf`;
    const pdfUrl = `/exports/${filename}`;

    // Store the content length for validation (in real implementation, this would be file size)
    const contentLength = pdfContent.length;
    
    if (contentLength === 0) {
      throw new Error('Generated PDF content is empty');
    }

    return {
      pdfUrl
    };
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};
