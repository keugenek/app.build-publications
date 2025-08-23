import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

const testInput: CreateQuestionInput = {
  subject: 'Mathematics',
  topic: 'Algebra',
  content: 'What is x if 2x = 10?',
};

describe('createQuestion handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a question and return it', async () => {
    const result = await createQuestion(testInput);

    expect(result.id).toBeGreaterThan(0);
    expect(result.subject).toBe(testInput.subject);
    expect(result.topic).toBe(testInput.topic);
    expect(result.content).toBe(testInput.content);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the question in the database', async () => {
    const result = await createQuestion(testInput);

    const rows = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.subject).toBe(testInput.subject);
    expect(row.topic).toBe(testInput.topic);
    expect(row.content).toBe(testInput.content);
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
