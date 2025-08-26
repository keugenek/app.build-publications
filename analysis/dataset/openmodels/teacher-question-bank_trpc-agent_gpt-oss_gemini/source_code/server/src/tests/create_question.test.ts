import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test input covering all required fields
const testInput: CreateQuestionInput = {
  subject: 'Mathematics',
  topic: 'Algebra',
  question_text: 'What is the solution to x + 2 = 5?',
  answer_text: 'x = 3',
};

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a question and return all fields', async () => {
    const result = await createQuestion(testInput);

    expect(result.id).toBeDefined();
    expect(result.subject).toBe(testInput.subject);
    expect(result.topic).toBe(testInput.topic);
    expect(result.question_text).toBe(testInput.question_text);
    expect(result.answer_text).toBe(testInput.answer_text);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the question in the database', async () => {
    const created = await createQuestion(testInput);

    const rows = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const dbQuestion = rows[0];
    expect(dbQuestion.subject).toBe(testInput.subject);
    expect(dbQuestion.topic).toBe(testInput.topic);
    expect(dbQuestion.question_text).toBe(testInput.question_text);
    expect(dbQuestion.answer_text).toBe(testInput.answer_text);
    expect(dbQuestion.created_at).toBeInstanceOf(Date);
  });
});
