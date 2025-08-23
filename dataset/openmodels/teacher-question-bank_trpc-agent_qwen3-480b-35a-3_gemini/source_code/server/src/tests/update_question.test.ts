import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type UpdateQuestionInput, type CreateSubjectInput, type CreateTopicInput, type CreateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Helper function to create a subject
const createSubject = async (input: CreateSubjectInput) => {
  const result = await db.insert(subjectsTable)
    .values(input)
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a topic
const createTopic = async (input: CreateTopicInput) => {
  const result = await db.insert(topicsTable)
    .values(input)
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a question
const createQuestion = async (input: CreateQuestionInput) => {
  const result = await db.insert(questionsTable)
    .values({
      text: input.text,
      answer: input.answer,
      subject_id: input.subject_id,
      topic_id: input.topic_id
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateQuestion', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    const subject = await createSubject({ name: 'Mathematics' });
    const topic = await createTopic({ name: 'Algebra', subject_id: subject.id });
    
    // Create a question to update
    await createQuestion({
      text: 'What is 2+2?',
      answer: '4',
      subject_id: subject.id,
      topic_id: topic.id
    });
  });
  
  afterEach(resetDB);

  it('should update a question text', async () => {
    // First, get the question we created
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2+2?'))
      .execute();
    
    expect(existingQuestion).toHaveLength(1);
    
    const updateInput: UpdateQuestionInput = {
      id: existingQuestion[0].id,
      text: 'What is 3+3?'
    };
    
    const result = await updateQuestion(updateInput);
    
    // Validate the returned data
    expect(result.id).toEqual(existingQuestion[0].id);
    expect(result.text).toEqual('What is 3+3?');
    expect(result.answer).toEqual('4'); // Should remain unchanged
    expect(result.subject_id).toEqual(existingQuestion[0].subject_id);
    expect(result.topic_id).toEqual(existingQuestion[0].topic_id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(existingQuestion[0].updated_at.getTime());
  });

  it('should update a question answer', async () => {
    // First, get the question we created
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2+2?'))
      .execute();
    
    expect(existingQuestion).toHaveLength(1);
    
    const updateInput: UpdateQuestionInput = {
      id: existingQuestion[0].id,
      answer: 'Four'
    };
    
    const result = await updateQuestion(updateInput);
    
    // Validate the returned data
    expect(result.id).toEqual(existingQuestion[0].id);
    expect(result.text).toEqual('What is 2+2?'); // Should remain unchanged
    expect(result.answer).toEqual('Four');
    expect(result.subject_id).toEqual(existingQuestion[0].subject_id);
    expect(result.topic_id).toEqual(existingQuestion[0].topic_id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // First, get the question we created
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2+2?'))
      .execute();
    
    expect(existingQuestion).toHaveLength(1);
    
    // Create another subject and topic for the update
    const newSubject = await createSubject({ name: 'Science' });
    const newTopic = await createTopic({ name: 'Physics', subject_id: newSubject.id });
    
    const updateInput: UpdateQuestionInput = {
      id: existingQuestion[0].id,
      text: 'What is the speed of light?',
      answer: '299,792,458 m/s',
      subject_id: newSubject.id,
      topic_id: newTopic.id
    };
    
    const result = await updateQuestion(updateInput);
    
    // Validate the returned data
    expect(result.id).toEqual(existingQuestion[0].id);
    expect(result.text).toEqual('What is the speed of light?');
    expect(result.answer).toEqual('299,792,458 m/s');
    expect(result.subject_id).toEqual(newSubject.id);
    expect(result.topic_id).toEqual(newTopic.id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated question to database', async () => {
    // First, get the question we created
    const existingQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.text, 'What is 2+2?'))
      .execute();
    
    expect(existingQuestion).toHaveLength(1);
    
    const updateInput: UpdateQuestionInput = {
      id: existingQuestion[0].id,
      text: 'Updated question text'
    };
    
    const result = await updateQuestion(updateInput);
    
    // Verify the update was saved to the database
    const updatedQuestion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();
    
    expect(updatedQuestion).toHaveLength(1);
    expect(updatedQuestion[0].text).toEqual('Updated question text');
    expect(updatedQuestion[0].answer).toEqual('4'); // Should remain unchanged
    expect(updatedQuestion[0].updated_at.getTime()).toBeGreaterThanOrEqual(existingQuestion[0].updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent question', async () => {
    const updateInput: UpdateQuestionInput = {
      id: 99999, // Non-existent ID
      text: 'New text'
    };
    
    await expect(updateQuestion(updateInput)).rejects.toThrow(/not found/i);
  });
});
