import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type GenerateQuizInput, type QuizWithQuestions, type Question } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizWithQuestions> {
  try {
    // Verify that the subject and topic exist and are related
    const topicExists = await db.select()
      .from(topicsTable)
      .innerJoin(subjectsTable, eq(topicsTable.subject_id, subjectsTable.id))
      .where(
        and(
          eq(topicsTable.id, input.topic_id),
          eq(subjectsTable.id, input.subject_id),
          eq(topicsTable.subject_id, input.subject_id)
        )
      )
      .execute();

    if (topicExists.length === 0) {
      throw new Error('Invalid subject and topic combination or they do not exist');
    }

    // Get available questions for the subject and topic
    const availableQuestions = await db.select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.subject_id, input.subject_id),
          eq(questionsTable.topic_id, input.topic_id)
        )
      )
      .execute();

    if (availableQuestions.length === 0) {
      throw new Error('No questions available for the specified subject and topic');
    }

    if (availableQuestions.length < input.question_count) {
      throw new Error(`Only ${availableQuestions.length} questions available, but ${input.question_count} requested`);
    }

    // Randomly select questions
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, input.question_count);

    // Create the quiz record
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: input.title,
        subject_id: input.subject_id,
        topic_id: input.topic_id,
        question_count: input.question_count
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create quiz-question associations with order
    const quizQuestionInserts = selectedQuestions.map((question, index) => ({
      quiz_id: quiz.id,
      question_id: question.id,
      order_index: index + 1 // 1-based indexing for order
    }));

    await db.insert(quizQuestionsTable)
      .values(quizQuestionInserts)
      .execute();

    // Format questions for return type
    const questions: Question[] = selectedQuestions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      answer_text: q.answer_text,
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      created_at: q.created_at
    }));

    return {
      id: quiz.id,
      title: quiz.title,
      subject_id: quiz.subject_id,
      topic_id: quiz.topic_id,
      question_count: quiz.question_count,
      created_at: quiz.created_at,
      questions
    };
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
}
