import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput, type Quiz, type Question } from '../schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export const generateQuiz = async (input: GenerateQuizInput): Promise<{ quiz: Quiz; questions: Question[] }> => {
  try {
    // Start a transaction to ensure consistency
    return await db.transaction(async (tx) => {
      // Create a new quiz
      const quizResult = await tx.insert(quizzesTable)
        .values({
          name: `Quiz - ${new Date().toISOString()}`,
        })
        .returning()
        .execute();
      
      const quiz = quizResult[0];
      
      // Build conditions for selecting questions
      const conditions = [
        inArray(questionsTable.subject_id, input.subject_ids)
      ];
      
      // If topic_ids are specified, add topic filter
      if (input.topic_ids && input.topic_ids.length > 0) {
        conditions.push(inArray(questionsTable.topic_id, input.topic_ids));
      }
      
      // Select random questions based on the criteria
      const selectedQuestions = await tx.select()
        .from(questionsTable)
        .where(and(...conditions))
        .orderBy(sql`RANDOM()`)
        .limit(input.num_questions)
        .execute();
      
      // If we don't have enough questions, throw an error
      if (selectedQuestions.length === 0) {
        throw new Error('No questions found matching the criteria');
      }
      
      // Insert quiz questions with order
      const quizQuestions = selectedQuestions.map((question, index) => ({
        quiz_id: quiz.id,
        question_id: question.id,
        order: index + 1
      }));
      
      if (quizQuestions.length > 0) {
        await tx.insert(quizQuestionsTable)
          .values(quizQuestions)
          .execute();
      }
      
      // Convert numeric fields back to numbers before returning
      const formattedQuestions = selectedQuestions.map(question => ({
        ...question,
        subject_id: question.subject_id,
        topic_id: question.topic_id
      }));
      
      return {
        quiz: {
          ...quiz,
        },
        questions: formattedQuestions
      };
    });
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
};
