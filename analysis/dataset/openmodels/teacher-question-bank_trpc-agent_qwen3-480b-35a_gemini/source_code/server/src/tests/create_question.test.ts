import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateQuestionInput = {
  question_text: 'What is the capital of France?',
  subject: 'Geography',
  topic: 'European Capitals',
  answer: 'Paris',
};

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a question', async () => {
    const result = await createQuestion(testInput);

    // Basic field validation
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.subject).toEqual('Geography');
    expect(result.topic).toEqual('European Capitals');
    expect(result.answer).toEqual('Paris');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const result = await createQuestion(testInput);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].question_text).toEqual('What is the capital of France?');
    expect(questions[0].subject).toEqual('Geography');
    expect(questions[0].topic).toEqual('European Capitals');
    expect(questions[0].answer).toEqual('Paris');
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });
});
