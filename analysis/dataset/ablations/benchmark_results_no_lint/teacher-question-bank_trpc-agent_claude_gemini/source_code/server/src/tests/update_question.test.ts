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

  let testSubject: any;
  let testTopic: any;
  let testQuestion: any;

  beforeEach(async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();
    testSubject = subjectResult[0];

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: testSubject.id
      })
      .returning()
      .execute();
    testTopic = topicResult[0];

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Original question?',
        answer_text: 'Original answer',
        subject_id: testSubject.id,
        topic_id: testTopic.id
      })
      .returning()
      .execute();
    testQuestion = questionResult[0];
  });

  it('should update question text only', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      question_text: 'Updated question text?'
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestion.id);
    expect(result.question_text).toEqual('Updated question text?');
    expect(result.answer_text).toEqual('Original answer');
    expect(result.subject_id).toEqual(testSubject.id);
    expect(result.topic_id).toEqual(testTopic.id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].question_text).toEqual('Updated question text?');
    expect(dbQuestion[0].answer_text).toEqual('Original answer');
  });

  it('should update answer text only', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      answer_text: 'Updated answer text'
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestion.id);
    expect(result.question_text).toEqual('Original question?');
    expect(result.answer_text).toEqual('Updated answer text');
    expect(result.subject_id).toEqual(testSubject.id);
    expect(result.topic_id).toEqual(testTopic.id);

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].question_text).toEqual('Original question?');
    expect(dbQuestion[0].answer_text).toEqual('Updated answer text');
  });

  it('should update all fields at once', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      question_text: 'Completely new question?',
      answer_text: 'Completely new answer',
      subject_id: testSubject.id,
      topic_id: testTopic.id
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestion.id);
    expect(result.question_text).toEqual('Completely new question?');
    expect(result.answer_text).toEqual('Completely new answer');
    expect(result.subject_id).toEqual(testSubject.id);
    expect(result.topic_id).toEqual(testTopic.id);

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].question_text).toEqual('Completely new question?');
    expect(dbQuestion[0].answer_text).toEqual('Completely new answer');
  });

  it('should update subject and topic when both exist and are compatible', async () => {
    // Create another subject and topic
    const newSubjectResult = await db.insert(subjectsTable)
      .values({
        name: 'New Subject',
        description: 'Another subject'
      })
      .returning()
      .execute();
    const newSubject = newSubjectResult[0];

    const newTopicResult = await db.insert(topicsTable)
      .values({
        name: 'New Topic',
        description: 'Another topic',
        subject_id: newSubject.id
      })
      .returning()
      .execute();
    const newTopic = newTopicResult[0];

    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      subject_id: newSubject.id,
      topic_id: newTopic.id
    };

    const result = await updateQuestion(input);

    expect(result.id).toEqual(testQuestion.id);
    expect(result.subject_id).toEqual(newSubject.id);
    expect(result.topic_id).toEqual(newTopic.id);
    expect(result.question_text).toEqual('Original question?');
    expect(result.answer_text).toEqual('Original answer');

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].subject_id).toEqual(newSubject.id);
    expect(dbQuestion[0].topic_id).toEqual(newTopic.id);
  });

  it('should throw error when question does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: 99999,
      question_text: 'This should fail'
    };

    expect(updateQuestion(input)).rejects.toThrow(/Question with id 99999 not found/);
  });

  it('should throw error when subject does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      subject_id: 99999
    };

    expect(updateQuestion(input)).rejects.toThrow(/Subject with id 99999 not found/);
  });

  it('should throw error when topic does not exist', async () => {
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      topic_id: 99999
    };

    expect(updateQuestion(input)).rejects.toThrow(/Topic with id 99999 not found/);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Create another subject and topic
    const anotherSubjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Another Subject',
        description: 'Different subject'
      })
      .returning()
      .execute();
    const anotherSubject = anotherSubjectResult[0];

    const anotherTopicResult = await db.insert(topicsTable)
      .values({
        name: 'Another Topic',
        description: 'Topic for different subject',
        subject_id: anotherSubject.id
      })
      .returning()
      .execute();
    const anotherTopic = anotherTopicResult[0];

    // Try to update question with topic from different subject
    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      topic_id: anotherTopic.id
    };

    expect(updateQuestion(input)).rejects.toThrow(/Topic with id .+ not found or does not belong to subject/);
  });

  it('should allow updating topic when subject is also being updated', async () => {
    // Create another subject and topic
    const newSubjectResult = await db.insert(subjectsTable)
      .values({
        name: 'New Subject',
        description: 'Another subject'
      })
      .returning()
      .execute();
    const newSubject = newSubjectResult[0];

    const newTopicResult = await db.insert(topicsTable)
      .values({
        name: 'New Topic',
        description: 'Topic for new subject',
        subject_id: newSubject.id
      })
      .returning()
      .execute();
    const newTopic = newTopicResult[0];

    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      subject_id: newSubject.id,
      topic_id: newTopic.id
    };

    const result = await updateQuestion(input);

    expect(result.subject_id).toEqual(newSubject.id);
    expect(result.topic_id).toEqual(newTopic.id);

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].subject_id).toEqual(newSubject.id);
    expect(dbQuestion[0].topic_id).toEqual(newTopic.id);
  });

  it('should preserve created_at timestamp', async () => {
    const originalCreatedAt = testQuestion.created_at;

    const input: UpdateQuestionInput = {
      id: testQuestion.id,
      question_text: 'Updated question'
    };

    const result = await updateQuestion(input);

    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());

    // Verify in database
    const dbQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, testQuestion.id))
      .execute();

    expect(dbQuestion[0].created_at.getTime()).toEqual(originalCreatedAt.getTime());
  });
});
