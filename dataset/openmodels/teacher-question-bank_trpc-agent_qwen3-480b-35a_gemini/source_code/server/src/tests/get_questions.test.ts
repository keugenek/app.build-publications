import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { getQuestions } from '../handlers/get_questions';
import { eq } from 'drizzle-orm';

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no questions exist', async () => {
    const result = await getQuestions();
    expect(result).toEqual([]);
  });

  it('should return all questions when questions exist', async () => {
    // Insert test data
    const testQuestions = [
      {
        question_text: 'What is the capital of France?',
        subject: 'Geography',
        topic: 'European Capitals',
        answer: 'Paris',
      },
      {
        question_text: 'What is 2 + 2?',
        subject: 'Mathematics',
        topic: 'Basic Arithmetic',
        answer: '4',
      },
    ];

    // Insert test questions into the database
    await db.insert(questionsTable).values(testQuestions).execute();

    const result = await getQuestions();

    expect(result).toHaveLength(2);
    
    // Check that all expected fields are present
    expect(result[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      question_text: expect.any(String),
      subject: expect.any(String),
      topic: expect.any(String),
      answer: expect.any(String),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    }));

    // Verify specific values
    const firstQuestion = result.find(q => q.question_text === 'What is the capital of France?');
    const secondQuestion = result.find(q => q.question_text === 'What is 2 + 2?');
    
    expect(firstQuestion).toBeDefined();
    expect(firstQuestion?.subject).toBe('Geography');
    expect(firstQuestion?.topic).toBe('European Capitals');
    expect(firstQuestion?.answer).toBe('Paris');
    
    expect(secondQuestion).toBeDefined();
    expect(secondQuestion?.subject).toBe('Mathematics');
    expect(secondQuestion?.topic).toBe('Basic Arithmetic');
    expect(secondQuestion?.answer).toBe('4');
  });

  it('should return questions with proper date types', async () => {
    // Insert a test question
    const testQuestion = {
      question_text: 'Test question?',
      subject: 'Test',
      topic: 'Testing',
      answer: 'Test answer',
    };

    await db.insert(questionsTable).values(testQuestion).execute();

    const result = await getQuestions();
    
    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
