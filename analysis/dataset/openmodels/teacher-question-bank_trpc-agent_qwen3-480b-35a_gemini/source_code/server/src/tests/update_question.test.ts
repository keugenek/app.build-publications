import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type UpdateQuestionInput, type CreateQuestionInput } from '../schema';
import { updateQuestion } from '../handlers/update_question';
import { eq } from 'drizzle-orm';

// Helper function to create a question for testing
const createTestQuestion = async (input: CreateQuestionInput) => {
  return await db.insert(questionsTable)
    .values({
      question_text: input.question_text,
      subject: input.subject,
      topic: input.topic,
      answer: input.answer,
    })
    .returning()
    .execute()
    .then(result => result[0]);
};

// Test input data
const testQuestionInput = {
  question_text: 'What is the capital of France?',
  subject: 'Geography',
  topic: 'European Capitals',
  answer: 'Paris'
};

describe('updateQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a question with all fields provided', async () => {
    // Create a test question first
    const createdQuestion = await createTestQuestion(testQuestionInput);
    
    // Prepare update input
    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      question_text: 'What is the capital of Germany?',
      subject: 'Geography',
      topic: 'European Capitals',
      answer: 'Berlin'
    };

    // Update the question
    const result = await updateQuestion(updateInput);

    // Validate the returned result
    expect(result.id).toEqual(createdQuestion.id);
    expect(result.question_text).toEqual('What is the capital of Germany?');
    expect(result.subject).toEqual('Geography');
    expect(result.topic).toEqual('European Capitals');
    expect(result.answer).toEqual('Berlin');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should update only specified fields of a question', async () => {
    // Create a test question first
    const createdQuestion = await createTestQuestion(testQuestionInput);
    
    // Prepare update input with only some fields
    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      question_text: 'What is the capital of Italy?',
      answer: 'Rome'
    };

    // Update the question
    const result = await updateQuestion(updateInput);

    // Validate the returned result
    expect(result.id).toEqual(createdQuestion.id);
    expect(result.question_text).toEqual('What is the capital of Italy?');
    expect(result.subject).toEqual(createdQuestion.subject); // Should remain unchanged
    expect(result.topic).toEqual(createdQuestion.topic); // Should remain unchanged
    expect(result.answer).toEqual('Rome');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated question to database', async () => {
    // Create a test question first
    const createdQuestion = await createTestQuestion(testQuestionInput);
    
    // Prepare update input
    const updateInput: UpdateQuestionInput = {
      id: createdQuestion.id,
      question_text: 'What is the capital of Spain?',
      answer: 'Madrid'
    };

    // Update the question
    await updateQuestion(updateInput);

    // Query the database to verify the update was saved
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, createdQuestion.id))
      .execute();

    expect(questions).toHaveLength(1);
    const updatedQuestion = questions[0];
    expect(updatedQuestion.question_text).toEqual('What is the capital of Spain?');
    expect(updatedQuestion.subject).toEqual(createdQuestion.subject); // Should remain unchanged
    expect(updatedQuestion.topic).toEqual(createdQuestion.topic); // Should remain unchanged
    expect(updatedQuestion.answer).toEqual('Madrid');
    expect(updatedQuestion.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at was updated
    expect(updatedQuestion.updated_at.getTime()).toBeGreaterThanOrEqual(createdQuestion.updated_at.getTime());
  });

  it('should throw an error when trying to update a non-existent question', async () => {
    // Prepare update input for a non-existent question
    const updateInput: UpdateQuestionInput = {
      id: 99999,
      question_text: 'This question does not exist'
    };

    // Attempt to update the question and expect it to fail
    await expect(updateQuestion(updateInput)).rejects.toThrow(/Question with id 99999 not found/);
  });
});
