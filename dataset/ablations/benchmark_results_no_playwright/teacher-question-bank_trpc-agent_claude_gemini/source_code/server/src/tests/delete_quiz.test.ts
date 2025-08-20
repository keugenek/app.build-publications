import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type DeleteQuizInput } from '../schema';
import { deleteQuiz } from '../handlers/delete_quiz';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteQuizInput = {
  id: 1
};

describe('deleteQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a quiz successfully', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        text: 'Test question?',
        subject_id: subject[0].id,
        topic_id: topic[0].id
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz' })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz[0].id,
        question_id: question[0].id
      })
      .execute();

    // Delete the quiz
    const result = await deleteQuiz({ id: quiz[0].id });

    expect(result.success).toBe(true);

    // Verify quiz is deleted from database
    const deletedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz[0].id))
      .execute();

    expect(deletedQuiz).toHaveLength(0);

    // Verify quiz questions are also deleted
    const deletedQuizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .execute();

    expect(deletedQuizQuestions).toHaveLength(0);

    // Verify question still exists (should not be deleted)
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question[0].id))
      .execute();

    expect(remainingQuestions).toHaveLength(1);
  });

  it('should delete quiz with multiple questions', async () => {
    // Create prerequisite data
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Create multiple questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          text: 'First question?',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        },
        {
          text: 'Second question?',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        },
        {
          text: 'Third question?',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        }
      ])
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Multi-Question Quiz' })
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz[0].id, question_id: questions[0].id },
        { quiz_id: quiz[0].id, question_id: questions[1].id },
        { quiz_id: quiz[0].id, question_id: questions[2].id }
      ])
      .execute();

    // Delete the quiz
    const result = await deleteQuiz({ id: quiz[0].id });

    expect(result.success).toBe(true);

    // Verify all quiz questions are deleted
    const remainingQuizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quiz[0].id))
      .execute();

    expect(remainingQuizQuestions).toHaveLength(0);

    // Verify all questions still exist
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .execute();

    expect(remainingQuestions).toHaveLength(3);
  });

  it('should throw error when quiz does not exist', async () => {
    await expect(deleteQuiz({ id: 999 }))
      .rejects
      .toThrow(/Quiz with id 999 not found/i);
  });

  it('should delete quiz without questions', async () => {
    // Create a quiz without any questions
    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Empty Quiz' })
      .returning()
      .execute();

    const result = await deleteQuiz({ id: quiz[0].id });

    expect(result.success).toBe(true);

    // Verify quiz is deleted
    const deletedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz[0].id))
      .execute();

    expect(deletedQuiz).toHaveLength(0);
  });

  it('should handle deletion with valid numeric id', async () => {
    // Create a quiz
    const quiz = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz for ID' })
      .returning()
      .execute();

    // Verify the input type works correctly
    const inputWithValidId: DeleteQuizInput = {
      id: quiz[0].id // This should be a number
    };

    const result = await deleteQuiz(inputWithValidId);

    expect(result.success).toBe(true);
    expect(typeof inputWithValidId.id).toBe('number');
  });
});
