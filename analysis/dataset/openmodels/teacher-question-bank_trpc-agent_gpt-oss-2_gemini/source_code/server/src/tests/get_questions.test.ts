import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';
import { getQuestions } from '../handlers/get_questions';

// Sample question data
const sampleQuestion = {
  subject: 'Math',
  topic: 'Algebra',
  content: 'What is x if 2x + 3 = 7?',
};

describe('getQuestions handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when there are no questions', async () => {
    const result = await getQuestions();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all questions from the database', async () => {
    // Insert a question directly via DB
    const inserted = await db
      .insert(questionsTable)
      .values({
        subject: sampleQuestion.subject,
        topic: sampleQuestion.topic,
        content: sampleQuestion.content,
      })
      .returning()
      .execute();

    // Ensure the insert succeeded
    expect(inserted).toHaveLength(1);
    const insertedRow = inserted[0] as Question;

    const result = await getQuestions();
    expect(result).toHaveLength(1);
    const fetched = result[0];

    // Verify fields match inserted data
    expect(fetched.id).toBe(insertedRow.id);
    expect(fetched.subject).toBe(sampleQuestion.subject);
    expect(fetched.topic).toBe(sampleQuestion.topic);
    expect(fetched.content).toBe(sampleQuestion.content);
    expect(fetched.created_at).toBeInstanceOf(Date);
  });
});
