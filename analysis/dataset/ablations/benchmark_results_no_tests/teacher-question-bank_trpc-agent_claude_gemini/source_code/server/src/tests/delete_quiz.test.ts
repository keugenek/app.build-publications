import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { deleteQuiz } from '../handlers/delete_quiz';
import { eq } from 'drizzle-orm';

describe('deleteQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing quiz', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create a quiz
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing'
      })
      .returning()
      .execute();

    // Delete the quiz
    const result = await deleteQuiz(quiz.id);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the quiz was deleted from database
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz.id))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent quiz', async () => {
    // Try to delete a quiz that doesn't exist
    const result = await deleteQuiz(999);

    // Verify the result indicates failure
    expect(result.success).toBe(false);
  });

  it('should cascade delete quiz-question associations', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create a question
    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2+2?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'short-answer',
        answer: '4'
      })
      .returning()
      .execute();

    // Create a quiz
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing'
      })
      .returning()
      .execute();

    // Add question to quiz
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question_id: question.id,
        order_index: 1
      })
      .execute();

    // Verify quiz-question association exists before deletion
    const quizQuestionsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz.id))
      .execute();

    expect(quizQuestionsBefore).toHaveLength(1);

    // Delete the quiz
    const result = await deleteQuiz(quiz.id);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the quiz was deleted
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz.id))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);

    // Verify quiz-question associations were cascade deleted
    const quizQuestionsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz.id))
      .execute();

    expect(quizQuestionsAfter).toHaveLength(0);

    // Verify the actual question still exists (should NOT be deleted)
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();

    expect(remainingQuestions).toHaveLength(1);
    expect(remainingQuestions[0].question_text).toBe('What is 2+2?');
  });

  it('should delete quiz with multiple questions', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create multiple questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is 2+2?',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'short-answer',
          answer: '4'
        },
        {
          question_text: 'What is the capital of France?',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'open-ended',
          answer: 'Paris'
        },
        {
          question_text: 'Is the Earth round?',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'true-false',
          answer: 'true'
        }
      ])
      .returning()
      .execute();

    // Create a quiz
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Multi-Question Test Quiz',
        description: 'A quiz with multiple questions'
      })
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values(questions.map((question, index) => ({
        quiz_id: quiz.id,
        question_id: question.id,
        order_index: index + 1
      })))
      .execute();

    // Verify all quiz-question associations exist before deletion
    const quizQuestionsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz.id))
      .execute();

    expect(quizQuestionsBefore).toHaveLength(3);

    // Delete the quiz
    const result = await deleteQuiz(quiz.id);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the quiz was deleted
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz.id))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);

    // Verify all quiz-question associations were cascade deleted
    const quizQuestionsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz.id))
      .execute();

    expect(quizQuestionsAfter).toHaveLength(0);

    // Verify all questions still exist (should NOT be deleted)
    for (const question of questions) {
      const remainingQuestions = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, question.id))
        .execute();

      expect(remainingQuestions).toHaveLength(1);
    }
  });

  it('should handle deleting quiz with no associated questions', async () => {
    // Create a quiz without any questions
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'A quiz with no questions'
      })
      .returning()
      .execute();

    // Delete the quiz
    const result = await deleteQuiz(quiz.id);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the quiz was deleted
    const remainingQuizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz.id))
      .execute();

    expect(remainingQuizzes).toHaveLength(0);
  });
});
