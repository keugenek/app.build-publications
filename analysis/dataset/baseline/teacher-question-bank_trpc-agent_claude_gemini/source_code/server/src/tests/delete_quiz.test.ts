import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, quizQuestionsTable, subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteQuiz } from '../handlers/delete_quiz';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteInput = {
  id: 1
};

describe('deleteQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a quiz successfully', async () => {
    // Create a test quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Delete the quiz
    const result = await deleteQuiz({ id: quizId });

    // Verify success response
    expect(result.success).toBe(true);

    // Verify quiz was deleted from database
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);
  });

  it('should cascade delete quiz-question associations', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        explanation: 'Basic math',
        difficulty_level: 'easy',
        subject_id: subject[0].id,
        topic_id: topic[0].id
      })
      .returning()
      .execute();

    // Create a quiz with questions
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Math Quiz',
        description: 'A math quiz for testing'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Add question to quiz
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_id: question[0].id,
        question_order: 1
      })
      .execute();

    // Verify association exists
    const associations = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(associations).toHaveLength(1);

    // Delete the quiz
    const result = await deleteQuiz({ id: quizId });

    // Verify success
    expect(result.success).toBe(true);

    // Verify quiz was deleted
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);

    // Verify quiz-question associations were cascade deleted
    const remainingAssociations = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(remainingAssociations).toHaveLength(0);

    // Verify questions themselves are NOT deleted (only associations)
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question[0].id))
      .execute();

    expect(remainingQuestions).toHaveLength(1);
  });

  it('should return false when quiz does not exist', async () => {
    // Try to delete a non-existent quiz
    const result = await deleteQuiz({ id: 999 });

    // Verify failure response
    expect(result.success).toBe(false);
  });

  it('should handle multiple quiz-question associations', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Science Subject',
        description: 'Science for testing'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Physics Topic',
        description: 'Physics for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Create multiple questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is gravity?',
          option_a: 'A force',
          option_b: 'A theory',
          option_c: 'A law',
          option_d: 'A constant',
          correct_answer: 'A',
          explanation: 'Gravity is a fundamental force',
          difficulty_level: 'medium',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        },
        {
          question_text: 'What is mass?',
          option_a: 'Weight',
          option_b: 'Volume',
          option_c: 'Matter quantity',
          option_d: 'Density',
          correct_answer: 'C',
          explanation: 'Mass is the quantity of matter',
          difficulty_level: 'easy',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        }
      ])
      .returning()
      .execute();

    // Create quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Physics Quiz',
        description: 'A comprehensive physics quiz'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Add multiple questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quizId,
          question_id: questions[0].id,
          question_order: 1
        },
        {
          quiz_id: quizId,
          question_id: questions[1].id,
          question_order: 2
        }
      ])
      .execute();

    // Verify associations exist
    const associations = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(associations).toHaveLength(2);

    // Delete the quiz
    const result = await deleteQuiz({ id: quizId });

    // Verify success
    expect(result.success).toBe(true);

    // Verify all associations were cascade deleted
    const remainingAssociations = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(remainingAssociations).toHaveLength(0);

    // Verify questions still exist
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .execute();

    expect(remainingQuestions).toHaveLength(2);
  });
});
