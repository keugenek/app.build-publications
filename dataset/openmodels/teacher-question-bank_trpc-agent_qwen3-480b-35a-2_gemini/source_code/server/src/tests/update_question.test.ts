import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type CreateSubjectInput, type CreateTopicInput, type CreateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Helper functions to create test data
const createSubject = async (input: CreateSubjectInput) => {
  const result = await db.insert(subjectsTable)
    .values({ name: input.name })
    .returning()
    .execute();
  return result[0];
};

const createTopic = async (input: CreateTopicInput) => {
  const result = await db.insert(topicsTable)
    .values({ 
      name: input.name, 
      subject_id: input.subject_id 
    })
    .returning()
    .execute();
  return result[0];
};

const createQuestion = async (input: CreateQuestionInput) => {
  const result = await db.insert(questionsTable)
    .values({
      text: input.text,
      type: input.type,
      correct_answer: input.correct_answer,
      subject_id: input.subject_id,
      topic_id: input.topic_id
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a question text', async () => {
    // Setup: Create subject, topic, and question
    const subject = await createSubject({ name: 'Math' });
    const topic = await createTopic({ name: 'Algebra', subject_id: subject.id });
    const question = await createQuestion({
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: subject.id,
      topic_id: topic.id
    });

    // Update the question
    const updateInput: UpdateQuestionInput = {
      id: question.id,
      text: 'What is 3+3?'
    };

    const result = await updateQuestion(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(question.id);
    expect(result.text).toEqual('What is 3+3?');
    expect(result.type).toEqual('Multiple Choice');
    expect(result.correct_answer).toEqual('4');
    expect(result.subject_id).toEqual(subject.id);
    expect(result.topic_id).toEqual(topic.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update question type and correct answer', async () => {
    // Setup: Create subject, topic, and question
    const subject = await createSubject({ name: 'Science' });
    const topic = await createTopic({ name: 'Physics', subject_id: subject.id });
    const question = await createQuestion({
      text: 'What is gravity?',
      type: 'Multiple Choice',
      correct_answer: 'A force',
      subject_id: subject.id,
      topic_id: topic.id
    });

    // Update the question
    const updateInput: UpdateQuestionInput = {
      id: question.id,
      type: 'Open Ended',
      correct_answer: 'Natural phenomenon that attracts objects'
    };

    const result = await updateQuestion(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(question.id);
    expect(result.text).toEqual('What is gravity?');
    expect(result.type).toEqual('Open Ended');
    expect(result.correct_answer).toEqual('Natural phenomenon that attracts objects');
    expect(result.subject_id).toEqual(subject.id);
    expect(result.topic_id).toEqual(topic.id);
  });

  it('should update subject and topic references', async () => {
    // Setup: Create subjects, topics, and question
    const subject1 = await createSubject({ name: 'Math' });
    const subject2 = await createSubject({ name: 'Science' });
    const topic1 = await createTopic({ name: 'Algebra', subject_id: subject1.id });
    const topic2 = await createTopic({ name: 'Physics', subject_id: subject2.id });
    
    const question = await createQuestion({
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: subject1.id,
      topic_id: topic1.id
    });

    // Update the question with new subject and topic
    const updateInput: UpdateQuestionInput = {
      id: question.id,
      subject_id: subject2.id,
      topic_id: topic2.id
    };

    const result = await updateQuestion(updateInput);

    // Verify the updated fields
    expect(result.subject_id).toEqual(subject2.id);
    expect(result.topic_id).toEqual(topic2.id);
  });

  it('should throw error when question does not exist', async () => {
    const updateInput: UpdateQuestionInput = {
      id: 99999,
      text: 'Updated text'
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Question with id 99999 not found/);
  });

  it('should throw error when subject does not exist', async () => {
    // Setup: Create a question
    const subject = await createSubject({ name: 'Math' });
    const topic = await createTopic({ name: 'Algebra', subject_id: subject.id });
    const question = await createQuestion({
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: subject.id,
      topic_id: topic.id
    });

    const updateInput: UpdateQuestionInput = {
      id: question.id,
      subject_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Subject with id 99999 not found/);
  });

  it('should throw error when topic does not exist', async () => {
    // Setup: Create a question
    const subject = await createSubject({ name: 'Math' });
    const topic = await createTopic({ name: 'Algebra', subject_id: subject.id });
    const question = await createQuestion({
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: subject.id,
      topic_id: topic.id
    });

    const updateInput: UpdateQuestionInput = {
      id: question.id,
      topic_id: 99999
    };

    await expect(updateQuestion(updateInput)).rejects.toThrow(/Topic with id 99999 not found/);
  });

  it('should save updated question to database', async () => {
    // Setup: Create subject, topic, and question
    const subject = await createSubject({ name: 'Math' });
    const topic = await createTopic({ name: 'Algebra', subject_id: subject.id });
    const question = await createQuestion({
      text: 'What is 2+2?',
      type: 'Multiple Choice',
      correct_answer: '4',
      subject_id: subject.id,
      topic_id: topic.id
    });

    // Update the question
    const updateInput: UpdateQuestionInput = {
      id: question.id,
      text: 'What is 5+5?',
      correct_answer: '10'
    };

    await updateQuestion(updateInput);

    // Query database to verify update was saved
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toEqual('What is 5+5?');
    expect(questions[0].correct_answer).toEqual('10');
    expect(questions[0].subject_id).toEqual(subject.id);
    expect(questions[0].topic_id).toEqual(topic.id);
  });
});
