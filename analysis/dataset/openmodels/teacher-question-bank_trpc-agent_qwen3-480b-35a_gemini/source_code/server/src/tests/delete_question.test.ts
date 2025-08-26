import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type DeleteQuestionInput } from '../schema';
import { deleteQuestion } from '../handlers/delete_question';
import { eq } from 'drizzle-orm';

// Test input for creating a question
const createInput: CreateQuestionInput = {
  question_text: 'What is the capital of France?',
  subject: 'Geography',
  topic: 'Europe',
  answer: 'Paris'
};

// Test input for deleting a question
const deleteInput: DeleteQuestionInput = {
  id: 1
};

describe('deleteQuestion', () => {
  beforeEach(async () => {
    await createDB();
    // Create a test question first
    await db.insert(questionsTable)
      .values(createInput)
      .execute();
  });
  afterEach(resetDB);

  it('should delete a question', async () => {
    // First verify the question exists
    const existingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, 1))
      .execute();
    
    expect(existingQuestions).toHaveLength(1);
    expect(existingQuestions[0].question_text).toEqual('What is the capital of France?');

    // Delete the question
    await deleteQuestion(deleteInput);

    // Verify the question was deleted
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, 1))
      .execute();

    expect(questions).toHaveLength(0);
  });

  it('should not throw an error when trying to delete a non-existent question', async () => {
    // Try to delete a question that doesn't exist
    const nonExistentInput: DeleteQuestionInput = { id: 999 };
    
    // This should not throw an error
    await expect(deleteQuestion(nonExistentInput)).resolves.toBeUndefined();
  });
});
