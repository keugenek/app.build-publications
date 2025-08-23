import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { getQuizzes } from '../handlers/get_quizzes';
import { eq } from 'drizzle-orm';

describe('getQuizzes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no quizzes exist', async () => {
    const result = await getQuizzes();
    expect(result).toEqual([]);
  });

  it('should return all quizzes when quizzes exist', async () => {
    // Insert test quizzes
    const quiz1 = await db.insert(quizzesTable)
      .values({ name: 'Math Quiz' })
      .returning()
      .execute()
      .then(res => res[0]);

    const quiz2 = await db.insert(quizzesTable)
      .values({ name: 'Science Quiz' })
      .returning()
      .execute()
      .then(res => res[0]);

    const result = await getQuizzes();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: quiz1.id,
        name: 'Math Quiz',
        created_at: expect.any(Date)
      },
      {
        id: quiz2.id,
        name: 'Science Quiz',
        created_at: expect.any(Date)
      }
    ]);
  });

  it('should return quizzes with correct data types', async () => {
    // Insert a test quiz
    const insertedQuiz = await db.insert(quizzesTable)
      .values({ name: 'History Quiz' })
      .returning()
      .execute()
      .then(res => res[0]);

    const result = await getQuizzes();

    expect(result).toHaveLength(1);
    const quiz = result[0];
    
    // Check that all fields exist with correct types
    expect(quiz.id).toBeTypeOf('number');
    expect(quiz.name).toBeTypeOf('string');
    expect(quiz.created_at).toBeInstanceOf(Date);
    
    // Check that values match what was inserted
    expect(quiz.id).toBe(insertedQuiz.id);
    expect(quiz.name).toBe('History Quiz');
  });
});
