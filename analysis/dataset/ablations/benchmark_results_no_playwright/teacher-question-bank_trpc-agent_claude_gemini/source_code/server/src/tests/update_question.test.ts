import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

describe('updateQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testSubjectId: number;
  let testTopicId: number;
  let testQuestionId: number;
  let secondSubjectId: number;
  let secondTopicId: number;

  beforeEach(async () => {
    // Create test subject
    const subject = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    testSubjectId = subject[0].id;

    // Create second test subject
    const secondSubject = await db.insert(subjectsTable)
      .values({ name: 'Second Subject' })
      .returning()
      .execute();
    secondSubjectId = secondSubject[0].id;

    // Create test topic
    const topic = await db.insert(topicsTable)
      .values({ name: 'Test Topic', subject_id: testSubjectId })
      .returning()
      .execute();
    testTopicId = topic[0].id;

    // Create second test topic
    const secondTopic = await db.insert(topicsTable)
      .values({ name: 'Second Topic', subject_id: secondSubjectId })
      .returning()
      .execute();
    secondTopicId = secondTopic[0].id;

    // Create test question
    const question = await db.insert(questionsTable)
      .values({
        text: 'Original question text',
        subject_id: testSubjectId,
        topic_id: testTopicId
      })
      .returning()
      .execute();
    testQuestionId = question[0].id;
  });

  it('should update question text only', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      text: 'Updated question text'
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestionId);
    expect(result.text).toEqual('Updated question text');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.topic_id).toEqual(testTopicId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update subject_id only', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      subject_id: secondSubjectId
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestionId);
    expect(result.text).toEqual('Original question text');
    expect(result.subject_id).toEqual(secondSubjectId);
    expect(result.topic_id).toEqual(testTopicId);
  });

  it('should update topic_id only', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      topic_id: secondTopicId
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestionId);
    expect(result.text).toEqual('Original question text');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.topic_id).toEqual(secondTopicId);
  });

  it('should update multiple fields simultaneously', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      text: 'Completely updated question',
      subject_id: secondSubjectId,
      topic_id: secondTopicId
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestionId);
    expect(result.text).toEqual('Completely updated question');
    expect(result.subject_id).toEqual(secondSubjectId);
    expect(result.topic_id).toEqual(secondTopicId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated question to database', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      text: 'Database persistence test'
    };

    await updateQuestion(input);

    // Verify the change was persisted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestionId))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toEqual('Database persistence test');
    expect(questions[0].subject_id).toEqual(testSubjectId);
    expect(questions[0].topic_id).toEqual(testTopicId);
  });

  it('should return existing question when no fields to update', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestionId);
    expect(result.text).toEqual('Original question text');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.topic_id).toEqual(testTopicId);
  });

  it('should throw error when question does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: 99999,
      text: 'This will fail'
    };

    await expect(updateQuestion(input)).rejects.toThrow(/Question with id 99999 not found/i);
  });

  it('should throw error when subject_id does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      subject_id: 99999
    };

    await expect(updateQuestion(input)).rejects.toThrow(/Subject with id 99999 not found/i);
  });

  it('should throw error when topic_id does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      topic_id: 99999
    };

    await expect(updateQuestion(input)).rejects.toThrow(/Topic with id 99999 not found/i);
  });

  it('should validate foreign key constraints', async () => {
    // Test that we can successfully update to valid foreign keys
    const input: UpdateQuestionInput = {
      id: testQuestionId,
      text: 'Updated with valid foreign keys',
      subject_id: secondSubjectId,
      topic_id: secondTopicId
    };

    const result = await updateQuestion(input);

    expect(result.subject_id).toEqual(secondSubjectId);
    expect(result.topic_id).toEqual(secondTopicId);

    // Verify in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestionId))
      .execute();

    expect(questions[0].subject_id).toEqual(secondSubjectId);
    expect(questions[0].topic_id).toEqual(secondTopicId);
  });
});
