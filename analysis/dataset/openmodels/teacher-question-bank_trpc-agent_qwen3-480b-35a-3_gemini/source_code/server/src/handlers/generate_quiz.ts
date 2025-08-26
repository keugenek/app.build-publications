import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput, type Quiz, type Question } from '../schema';
import { and, eq, sql } from 'drizzle-orm';

export const generateQuiz = async (input: GenerateQuizInput): Promise<{ quiz: Quiz; questions: Question[] }> => {
  try {
    // Create the quiz first
    const quizResult = await db.insert(quizzesTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();
    
    const quiz = quizResult[0];
    
    // Build conditions for question selection
    const conditions: import('drizzle-orm').SQL<unknown>[] = [];
    
    if (input.subject_id !== undefined) {
      conditions.push(eq(questionsTable.subject_id, input.subject_id));
    }
    
    if (input.topic_id !== undefined) {
      conditions.push(eq(questionsTable.topic_id, input.topic_id));
    }
    
    // Select random questions based on the criteria
    const questionQuery = db.select()
      .from(questionsTable)
      .orderBy(sql`RANDOM()`)
      .limit(input.count)
      .$dynamic();
    
    // Apply conditions if any
    const finalQuery = conditions.length > 0 
      ? questionQuery.where(and(...conditions))
      : questionQuery;
    
    const selectedQuestions = await finalQuery.execute();
    
    // If we don't have enough questions, throw an error
    if (selectedQuestions.length < input.count) {
      throw new Error(`Not enough questions available. Requested: ${input.count}, Available: ${selectedQuestions.length}`);
    }
    
    // Insert the questions into the quiz_questions junction table
    if (selectedQuestions.length > 0) {
      const quizQuestionValues = selectedQuestions.map((question, index) => ({
        quiz_id: quiz.id,
        question_id: question.id,
        order: index + 1
      }));
      
      await db.insert(quizQuestionsTable)
        .values(quizQuestionValues)
        .execute();
    }
    
    // Convert questions to the proper schema type
    const questions: Question[] = selectedQuestions.map(question => ({
      id: question.id,
      text: question.text,
      answer: question.answer,
      subject_id: question.subject_id,
      topic_id: question.topic_id,
      created_at: question.created_at,
      updated_at: question.updated_at
    }));
    
    return {
      quiz: {
        id: quiz.id,
        name: quiz.name,
        created_at: quiz.created_at
      },
      questions
    };
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
};
