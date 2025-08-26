import { db } from '../db';
import { questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput, type Quiz } from '../schema';
import { eq, and, inArray, type SQL } from 'drizzle-orm';

export async function generateQuiz(input: GenerateQuizInput): Promise<Quiz> {
  try {
    // Step 1: Build conditions for filtering questions
    const conditions: SQL<unknown>[] = [];
    
    // Apply subject_ids filter if provided
    if (input.subject_ids && input.subject_ids.length > 0) {
      conditions.push(inArray(questionsTable.subject_id, input.subject_ids));
    }
    
    // Apply topic_ids filter if provided
    if (input.topic_ids && input.topic_ids.length > 0) {
      conditions.push(inArray(questionsTable.topic_id, input.topic_ids));
    }
    
    // Step 2: Execute query to get questions
    let selectedQuestions;
    
    if (conditions.length > 0) {
      // With filters
      const baseQuery = db.select()
        .from(questionsTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
      
      selectedQuestions = input.limit 
        ? await baseQuery.limit(input.limit).execute()
        : await baseQuery.execute();
    } else {
      // Without filters
      const baseQuery = db.select().from(questionsTable);
      
      selectedQuestions = input.limit 
        ? await baseQuery.limit(input.limit).execute()
        : await baseQuery.execute();
    }
    
    // Step 3: Create the quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: input.title
      })
      .returning()
      .execute();
    
    const quiz = quizResult[0];
    
    // Step 4: Associate questions with the quiz (if any questions found)
    if (selectedQuestions.length > 0) {
      const quizQuestionValues = selectedQuestions.map(question => ({
        quiz_id: quiz.id,
        question_id: question.id
      }));
      
      await db.insert(quizQuestionsTable)
        .values(quizQuestionValues)
        .execute();
    }
    
    return quiz;
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
}
