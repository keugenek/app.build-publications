import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq, inArray } from 'drizzle-orm';

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz with selected questions', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topicResult[0].id;

    const questionResults = await db.insert(questionsTable)
      .values([
        { text: 'What is 2 + 2?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is 3 + 3?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is 4 + 4?', subject_id: subjectId, topic_id: topicId }
      ])
      .returning()
      .execute();

    const questionIds = questionResults.map(q => q.id);

    const testInput: CreateQuizInput = {
      title: 'Basic Math Quiz',
      question_ids: [questionIds[0], questionIds[1]]
    };

    const result = await createQuiz(testInput);

    // Validate quiz creation
    expect(result.title).toEqual('Basic Math Quiz');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify quiz was saved to database
    const savedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(savedQuiz).toHaveLength(1);
    expect(savedQuiz[0].title).toEqual('Basic Math Quiz');
    expect(savedQuiz[0].created_at).toBeInstanceOf(Date);
  });

  it('should create quiz-question associations correctly', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Physics', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topicResult[0].id;

    const questionResults = await db.insert(questionsTable)
      .values([
        { text: 'What is gravity?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is velocity?', subject_id: subjectId, topic_id: topicId }
      ])
      .returning()
      .execute();

    const questionIds = questionResults.map(q => q.id);

    const testInput: CreateQuizInput = {
      title: 'Physics Quiz',
      question_ids: questionIds
    };

    const result = await createQuiz(testInput);

    // Verify quiz-question associations were created
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(2);
    expect(quizQuestions.map(qq => qq.question_id).sort()).toEqual(questionIds.sort());
    quizQuestions.forEach(qq => {
      expect(qq.quiz_id).toEqual(result.id);
      expect(questionIds).toContain(qq.question_id);
    });
  });

  it('should handle single question quiz', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'History' })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'World War', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topicResult[0].id;

    const questionResult = await db.insert(questionsTable)
      .values({ text: 'When did WWII start?', subject_id: subjectId, topic_id: topicId })
      .returning()
      .execute();

    const testInput: CreateQuizInput = {
      title: 'Single Question Quiz',
      question_ids: [questionResult[0].id]
    };

    const result = await createQuiz(testInput);

    expect(result.title).toEqual('Single Question Quiz');
    expect(result.id).toBeDefined();

    // Verify single quiz-question association
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(1);
    expect(quizQuestions[0].question_id).toEqual(questionResult[0].id);
  });

  it('should throw error when question IDs do not exist', async () => {
    const testInput: CreateQuizInput = {
      title: 'Invalid Quiz',
      question_ids: [999, 1000]
    };

    await expect(createQuiz(testInput)).rejects.toThrow(/Questions with IDs 999, 1000 do not exist/i);
  });

  it('should throw error when some question IDs do not exist', async () => {
    // Create one valid question
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'English' })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Grammar', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topicResult[0].id;

    const questionResult = await db.insert(questionsTable)
      .values({ text: 'What is a noun?', subject_id: subjectId, topic_id: topicId })
      .returning()
      .execute();

    const testInput: CreateQuizInput = {
      title: 'Mixed Valid Invalid Quiz',
      question_ids: [questionResult[0].id, 999] // One valid, one invalid
    };

    await expect(createQuiz(testInput)).rejects.toThrow(/Questions with IDs 999 do not exist/i);
  });

  it('should handle multiple questions correctly', async () => {
    // Create prerequisite data for multiple questions
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Computer Science' })
      .returning()
      .execute();
    const subjectId = subjectResult[0].id;

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Programming', subject_id: subjectId })
      .returning()
      .execute();
    const topicId = topicResult[0].id;

    const questionResults = await db.insert(questionsTable)
      .values([
        { text: 'What is a variable?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is a function?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is a loop?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is an array?', subject_id: subjectId, topic_id: topicId },
        { text: 'What is an object?', subject_id: subjectId, topic_id: topicId }
      ])
      .returning()
      .execute();

    const questionIds = questionResults.map(q => q.id);

    const testInput: CreateQuizInput = {
      title: 'Comprehensive Programming Quiz',
      question_ids: questionIds
    };

    const result = await createQuiz(testInput);

    expect(result.title).toEqual('Comprehensive Programming Quiz');

    // Verify all quiz-question associations were created
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(5);
    
    const associatedQuestionIds = quizQuestions.map(qq => qq.question_id).sort();
    expect(associatedQuestionIds).toEqual(questionIds.sort());
  });
});
