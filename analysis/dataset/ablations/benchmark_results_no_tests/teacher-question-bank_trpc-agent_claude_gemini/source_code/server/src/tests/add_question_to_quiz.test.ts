import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { addQuestionToQuiz } from '../handlers/add_question_to_quiz';
import { eq, and } from 'drizzle-orm';

describe('addQuestionToQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let subjectId: number;
  let topicId: number;
  let questionId1: number;
  let questionId2: number;
  let questionId3: number;
  let quizId: number;

  beforeEach(async () => {
    // Create test subject
    const subjects = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();
    subjectId = subjects[0].id;

    // Create test topic
    const topics = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectId
      })
      .returning()
      .execute();
    topicId = topics[0].id;

    // Create test questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Test Question 1',
          subject_id: subjectId,
          topic_id: topicId,
          type: 'multiple-choice',
          answer: 'A'
        },
        {
          question_text: 'Test Question 2',
          subject_id: subjectId,
          topic_id: topicId,
          type: 'true-false',
          answer: 'True'
        },
        {
          question_text: 'Test Question 3',
          subject_id: subjectId,
          topic_id: topicId,
          type: 'short-answer',
          answer: 'Test answer'
        }
      ])
      .returning()
      .execute();
    questionId1 = questions[0].id;
    questionId2 = questions[1].id;
    questionId3 = questions[2].id;

    // Create test quiz
    const quizzes = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing'
      })
      .returning()
      .execute();
    quizId = quizzes[0].id;
  });

  it('should add a question to an empty quiz', async () => {
    const result = await addQuestionToQuiz(quizId, questionId1, 0);

    expect(result.success).toBe(true);

    // Verify the quiz question was created
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    expect(quizQuestions).toHaveLength(1);
    expect(quizQuestions[0].question_id).toBe(questionId1);
    expect(quizQuestions[0].order_index).toBe(0);
  });

  it('should add a question at the beginning and shift existing questions', async () => {
    // First, add a question at index 0
    await addQuestionToQuiz(quizId, questionId2, 0);

    // Then add another question at index 0 (should shift the first one to index 1)
    const result = await addQuestionToQuiz(quizId, questionId1, 0);

    expect(result.success).toBe(true);

    // Verify the quiz questions and their order
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .orderBy(quizQuestionsTable.order_index)
      .execute();

    expect(quizQuestions).toHaveLength(2);
    expect(quizQuestions[0].question_id).toBe(questionId1);
    expect(quizQuestions[0].order_index).toBe(0);
    expect(quizQuestions[1].question_id).toBe(questionId2);
    expect(quizQuestions[1].order_index).toBe(1);
  });

  it('should add a question in the middle and shift subsequent questions', async () => {
    // Add questions at indices 0 and 1
    await addQuestionToQuiz(quizId, questionId1, 0);
    await addQuestionToQuiz(quizId, questionId2, 1);

    // Add a question at index 1 (should shift questionId2 to index 2)
    const result = await addQuestionToQuiz(quizId, questionId3, 1);

    expect(result.success).toBe(true);

    // Verify the quiz questions and their order
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .orderBy(quizQuestionsTable.order_index)
      .execute();

    expect(quizQuestions).toHaveLength(3);
    expect(quizQuestions[0].question_id).toBe(questionId1);
    expect(quizQuestions[0].order_index).toBe(0);
    expect(quizQuestions[1].question_id).toBe(questionId3);
    expect(quizQuestions[1].order_index).toBe(1);
    expect(quizQuestions[2].question_id).toBe(questionId2);
    expect(quizQuestions[2].order_index).toBe(2);
  });

  it('should add a question at the end without shifting', async () => {
    // Add questions at indices 0 and 1
    await addQuestionToQuiz(quizId, questionId1, 0);
    await addQuestionToQuiz(quizId, questionId2, 1);

    // Add a question at index 2 (at the end)
    const result = await addQuestionToQuiz(quizId, questionId3, 2);

    expect(result.success).toBe(true);

    // Verify the quiz questions and their order
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .orderBy(quizQuestionsTable.order_index)
      .execute();

    expect(quizQuestions).toHaveLength(3);
    expect(quizQuestions[0].question_id).toBe(questionId1);
    expect(quizQuestions[0].order_index).toBe(0);
    expect(quizQuestions[1].question_id).toBe(questionId2);
    expect(quizQuestions[1].order_index).toBe(1);
    expect(quizQuestions[2].question_id).toBe(questionId3);
    expect(quizQuestions[2].order_index).toBe(2);
  });

  it('should throw error when quiz does not exist', async () => {
    const nonExistentQuizId = 999999;

    await expect(addQuestionToQuiz(nonExistentQuizId, questionId1, 0))
      .rejects.toThrow(/Quiz with id 999999 not found/i);
  });

  it('should throw error when question does not exist', async () => {
    const nonExistentQuestionId = 999999;

    await expect(addQuestionToQuiz(quizId, nonExistentQuestionId, 0))
      .rejects.toThrow(/Question with id 999999 not found/i);
  });

  it('should throw error when question is already in the quiz', async () => {
    // First, add the question to the quiz
    await addQuestionToQuiz(quizId, questionId1, 0);

    // Try to add the same question again
    await expect(addQuestionToQuiz(quizId, questionId1, 1))
      .rejects.toThrow(/Question \d+ is already in quiz \d+/i);
  });

  it('should handle multiple quizzes independently', async () => {
    // Create another quiz
    const quiz2 = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz 2',
        description: 'Another quiz for testing'
      })
      .returning()
      .execute();
    const quizId2 = quiz2[0].id;

    // Add the same question to both quizzes
    await addQuestionToQuiz(quizId, questionId1, 0);
    const result = await addQuestionToQuiz(quizId2, questionId1, 0);

    expect(result.success).toBe(true);

    // Verify both quizzes have the question
    const quiz1Questions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    const quiz2Questions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId2))
      .execute();

    expect(quiz1Questions).toHaveLength(1);
    expect(quiz2Questions).toHaveLength(1);
    expect(quiz1Questions[0].question_id).toBe(questionId1);
    expect(quiz2Questions[0].question_id).toBe(questionId1);
  });
});
