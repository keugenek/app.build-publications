import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type DeleteQuestionInput } from '../schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing question', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: DeleteQuestionInput = {
      id: questionResult[0].id
    };

    // Delete the question
    const result = await deleteQuestion(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify question is deleted from database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionResult[0].id))
      .execute();

    expect(questions).toHaveLength(0);
  });

  it('should return false when question does not exist', async () => {
    const input: DeleteQuestionInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteQuestion(input);

    // Should return false for non-existent question
    expect(result.success).toBe(false);
  });

  it('should remove question from existing quizzes before deletion', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz' })
      .returning()
      .execute();

    // Add question to quiz
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizResult[0].id,
        question_id: questionResult[0].id
      })
      .execute();

    // Verify question is in quiz before deletion
    const beforeDeletion = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionResult[0].id))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    const input: DeleteQuestionInput = {
      id: questionResult[0].id
    };

    // Delete the question
    const result = await deleteQuestion(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify question is removed from quiz_questions table
    const afterDeletion = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionResult[0].id))
      .execute();

    expect(afterDeletion).toHaveLength(0);

    // Verify question is deleted from questions table
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionResult[0].id))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify quiz still exists (only the association is removed)
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizResult[0].id))
      .execute();

    expect(quizzes).toHaveLength(1);
  });

  it('should handle question in multiple quizzes correctly', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'What is the capital of France?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    // Create multiple quizzes
    const quiz1Result = await db.insert(quizzesTable)
      .values({ title: 'Quiz 1' })
      .returning()
      .execute();

    const quiz2Result = await db.insert(quizzesTable)
      .values({ title: 'Quiz 2' })
      .returning()
      .execute();

    // Add question to both quizzes
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz1Result[0].id,
          question_id: questionResult[0].id
        },
        {
          quiz_id: quiz2Result[0].id,
          question_id: questionResult[0].id
        }
      ])
      .execute();

    // Verify question is in both quizzes before deletion
    const beforeDeletion = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionResult[0].id))
      .execute();

    expect(beforeDeletion).toHaveLength(2);

    const input: DeleteQuestionInput = {
      id: questionResult[0].id
    };

    // Delete the question
    const result = await deleteQuestion(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify question is removed from all quiz_questions entries
    const afterDeletion = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionResult[0].id))
      .execute();

    expect(afterDeletion).toHaveLength(0);

    // Verify question is deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionResult[0].id))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify both quizzes still exist
    const quizzes = await db.select()
      .from(quizzesTable)
      .execute();

    expect(quizzes).toHaveLength(2);
  });

  it('should handle deletion of question not in any quiz', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'What is the capital of Germany?',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: DeleteQuestionInput = {
      id: questionResult[0].id
    };

    // Delete the question (not in any quiz)
    const result = await deleteQuestion(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify question is deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionResult[0].id))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify no orphaned quiz_questions entries exist
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, questionResult[0].id))
      .execute();

    expect(quizQuestions).toHaveLength(0);
  });
});
