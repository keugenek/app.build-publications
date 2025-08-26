import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

describe('deleteQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing question', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Test Description' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Test Topic Description',
        subject_id: subject.id 
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        explanation: 'Basic addition',
        difficulty_level: 'easy',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: question.id };

    // Delete the question
    const result = await deleteQuestion(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify question is deleted from database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();

    expect(questions).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent question', async () => {
    const input: DeleteInput = { id: 99999 };

    const result = await deleteQuestion(input);

    // Should return false for non-existent question
    expect(result.success).toBe(false);
  });

  it('should remove quiz-question associations when deleting question', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Test Description' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Test Topic Description',
        subject_id: subject.id 
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        explanation: 'Basic addition',
        difficulty_level: 'easy',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz', description: 'Test Quiz Description' })
      .returning()
      .execute();

    // Create quiz-question association
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question_id: question.id,
        question_order: 1
      })
      .execute();

    // Verify association exists before deletion
    const associationsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question.id))
      .execute();

    expect(associationsBefore).toHaveLength(1);

    const input: DeleteInput = { id: question.id };

    // Delete the question
    const result = await deleteQuestion(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify question is deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();

    expect(questions).toHaveLength(0);

    // Verify quiz-question associations are also deleted (CASCADE)
    const associationsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question.id))
      .execute();

    expect(associationsAfter).toHaveLength(0);

    // Verify quiz still exists
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz.id))
      .execute();

    expect(quizzes).toHaveLength(1);
  });

  it('should handle multiple quiz associations correctly', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: 'Test Description' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ 
        name: 'Test Topic', 
        description: 'Test Topic Description',
        subject_id: subject.id 
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        explanation: 'Basic addition',
        difficulty_level: 'easy',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    // Create multiple quizzes
    const [quiz1] = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz 1', description: 'First Quiz' })
      .returning()
      .execute();

    const [quiz2] = await db.insert(quizzesTable)
      .values({ title: 'Test Quiz 2', description: 'Second Quiz' })
      .returning()
      .execute();

    // Create multiple quiz-question associations
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz1.id, question_id: question.id, question_order: 1 },
        { quiz_id: quiz2.id, question_id: question.id, question_order: 1 }
      ])
      .execute();

    // Verify associations exist before deletion
    const associationsBefore = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question.id))
      .execute();

    expect(associationsBefore).toHaveLength(2);

    const input: DeleteInput = { id: question.id };

    // Delete the question
    const result = await deleteQuestion(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify all quiz-question associations are deleted
    const associationsAfter = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.question_id, question.id))
      .execute();

    expect(associationsAfter).toHaveLength(0);

    // Verify both quizzes still exist
    const quiz1AfterDelete = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz1.id))
      .execute();

    const quiz2AfterDelete = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quiz2.id))
      .execute();

    expect(quiz1AfterDelete).toHaveLength(1);
    expect(quiz2AfterDelete).toHaveLength(1);
  });
});
