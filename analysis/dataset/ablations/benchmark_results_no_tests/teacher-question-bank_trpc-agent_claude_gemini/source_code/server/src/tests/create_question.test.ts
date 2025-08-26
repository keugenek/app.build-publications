import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq, and } from 'drizzle-orm';

describe('createQuestion', () => {
  let testSubjectId: number;
  let testTopicId: number;
  let otherSubjectId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();
    testSubjectId = subject[0].id;

    // Create another subject for validation tests
    const otherSubject = await db.insert(subjectsTable)
      .values({
        name: 'Other Subject',
        description: 'Another subject'
      })
      .returning()
      .execute();
    otherSubjectId = otherSubject[0].id;

    // Create test topic under the first subject
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: testSubjectId
      })
      .returning()
      .execute();
    testTopicId = topic[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateQuestionInput = {
    question_text: 'What is the capital of France?',
    subject_id: 0, // Will be set in tests
    topic_id: 0, // Will be set in tests
    type: 'multiple-choice',
    answer: 'Paris'
  };

  it('should create a multiple-choice question', async () => {
    const input = {
      ...testInput,
      subject_id: testSubjectId,
      topic_id: testTopicId
    };

    const result = await createQuestion(input);

    // Basic field validation
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.topic_id).toEqual(testTopicId);
    expect(result.type).toEqual('multiple-choice');
    expect(result.answer).toEqual('Paris');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.options).toEqual([]); // Should have empty options array
  });

  it('should create an open-ended question without options', async () => {
    const input: CreateQuestionInput = {
      question_text: 'Explain the water cycle.',
      subject_id: testSubjectId,
      topic_id: testTopicId,
      type: 'open-ended',
      answer: 'The water cycle involves evaporation, condensation, and precipitation.'
    };

    const result = await createQuestion(input);

    expect(result.question_text).toEqual('Explain the water cycle.');
    expect(result.type).toEqual('open-ended');
    expect(result.options).toBeUndefined(); // Should not have options for non-multiple-choice
  });

  it('should create a true-false question', async () => {
    const input: CreateQuestionInput = {
      question_text: 'The Earth is flat.',
      subject_id: testSubjectId,
      topic_id: testTopicId,
      type: 'true-false',
      answer: 'false'
    };

    const result = await createQuestion(input);

    expect(result.question_text).toEqual('The Earth is flat.');
    expect(result.type).toEqual('true-false');
    expect(result.answer).toEqual('false');
    expect(result.options).toBeUndefined();
  });

  it('should create a short-answer question', async () => {
    const input: CreateQuestionInput = {
      question_text: 'What is 2 + 2?',
      subject_id: testSubjectId,
      topic_id: testTopicId,
      type: 'short-answer',
      answer: '4'
    };

    const result = await createQuestion(input);

    expect(result.question_text).toEqual('What is 2 + 2?');
    expect(result.type).toEqual('short-answer');
    expect(result.answer).toEqual('4');
    expect(result.options).toBeUndefined();
  });

  it('should save question to database', async () => {
    const input = {
      ...testInput,
      subject_id: testSubjectId,
      topic_id: testTopicId
    };

    const result = await createQuestion(input);

    // Query the database to verify the question was saved
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].question_text).toEqual('What is the capital of France?');
    expect(questions[0].subject_id).toEqual(testSubjectId);
    expect(questions[0].topic_id).toEqual(testTopicId);
    expect(questions[0].type).toEqual('multiple-choice');
    expect(questions[0].answer).toEqual('Paris');
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject does not exist', async () => {
    const input: CreateQuestionInput = {
      question_text: 'Test question',
      subject_id: 99999, // Non-existent subject
      topic_id: testTopicId,
      type: 'multiple-choice',
      answer: 'Test answer'
    };

    await expect(createQuestion(input)).rejects.toThrow(/Subject with id 99999 not found/);
  });

  it('should throw error when topic does not exist', async () => {
    const input: CreateQuestionInput = {
      question_text: 'Test question',
      subject_id: testSubjectId,
      topic_id: 99999, // Non-existent topic
      type: 'multiple-choice',
      answer: 'Test answer'
    };

    await expect(createQuestion(input)).rejects.toThrow(/Topic with id 99999 not found or does not belong to subject/);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Create a topic under the other subject
    const otherTopic = await db.insert(topicsTable)
      .values({
        name: 'Other Topic',
        subject_id: otherSubjectId
      })
      .returning()
      .execute();

    const input: CreateQuestionInput = {
      question_text: 'Test question',
      subject_id: testSubjectId, // Using first subject
      topic_id: otherTopic[0].id, // But topic belongs to other subject
      type: 'multiple-choice',
      answer: 'Test answer'
    };

    await expect(createQuestion(input)).rejects.toThrow(/Topic with id .+ not found or does not belong to subject/);
  });

  it('should validate question can be queried by subject and topic', async () => {
    const input = {
      ...testInput,
      subject_id: testSubjectId,
      topic_id: testTopicId
    };

    await createQuestion(input);

    // Query questions by subject
    const questionsBySubject = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.subject_id, testSubjectId))
      .execute();

    expect(questionsBySubject.length).toBeGreaterThan(0);
    expect(questionsBySubject[0].subject_id).toEqual(testSubjectId);

    // Query questions by topic
    const questionsByTopic = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, testTopicId))
      .execute();

    expect(questionsByTopic.length).toBeGreaterThan(0);
    expect(questionsByTopic[0].topic_id).toEqual(testTopicId);

    // Query questions by both subject and topic
    const questionsByBoth = await db.select()
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.subject_id, testSubjectId),
          eq(questionsTable.topic_id, testTopicId)
        )
      )
      .execute();

    expect(questionsByBoth.length).toBeGreaterThan(0);
    expect(questionsByBoth[0].subject_id).toEqual(testSubjectId);
    expect(questionsByBoth[0].topic_id).toEqual(testTopicId);
  });
});
