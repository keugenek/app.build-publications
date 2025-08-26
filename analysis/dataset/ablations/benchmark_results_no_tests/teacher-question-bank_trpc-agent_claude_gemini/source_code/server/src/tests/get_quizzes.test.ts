import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { getQuizzes } from '../handlers/get_quizzes';

// Test quiz inputs
const testQuiz1: CreateQuizInput = {
  title: 'Math Quiz 1',
  description: 'Basic arithmetic questions'
};

const testQuiz2: CreateQuizInput = {
  title: 'Science Quiz',
  description: 'Physics and chemistry questions'
};

const testQuiz3: CreateQuizInput = {
  title: 'History Quiz',
  description: null // Test nullable description
};

describe('getQuizzes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no quizzes exist', async () => {
    const results = await getQuizzes();

    expect(results).toEqual([]);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return all quizzes from database', async () => {
    // Create test quizzes
    await db.insert(quizzesTable)
      .values([
        {
          title: testQuiz1.title,
          description: testQuiz1.description
        },
        {
          title: testQuiz2.title,
          description: testQuiz2.description
        },
        {
          title: testQuiz3.title,
          description: testQuiz3.description
        }
      ])
      .execute();

    const results = await getQuizzes();

    expect(results).toHaveLength(3);
    expect(Array.isArray(results)).toBe(true);

    // Check first quiz
    const quiz1 = results.find(q => q.title === 'Math Quiz 1');
    expect(quiz1).toBeDefined();
    expect(quiz1!.title).toEqual('Math Quiz 1');
    expect(quiz1!.description).toEqual('Basic arithmetic questions');
    expect(quiz1!.id).toBeDefined();
    expect(quiz1!.created_at).toBeInstanceOf(Date);

    // Check second quiz
    const quiz2 = results.find(q => q.title === 'Science Quiz');
    expect(quiz2).toBeDefined();
    expect(quiz2!.title).toEqual('Science Quiz');
    expect(quiz2!.description).toEqual('Physics and chemistry questions');
    expect(quiz2!.id).toBeDefined();
    expect(quiz2!.created_at).toBeInstanceOf(Date);

    // Check third quiz with nullable description
    const quiz3 = results.find(q => q.title === 'History Quiz');
    expect(quiz3).toBeDefined();
    expect(quiz3!.title).toEqual('History Quiz');
    expect(quiz3!.description).toBeNull();
    expect(quiz3!.id).toBeDefined();
    expect(quiz3!.created_at).toBeInstanceOf(Date);
  });

  it('should return quizzes in chronological order', async () => {
    // Create quizzes with slight delay to ensure different timestamps
    await db.insert(quizzesTable)
      .values({
        title: 'First Quiz',
        description: 'Created first'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(quizzesTable)
      .values({
        title: 'Second Quiz',
        description: 'Created second'
      })
      .execute();

    const results = await getQuizzes();

    expect(results).toHaveLength(2);
    
    // Find quizzes by title
    const firstQuiz = results.find(q => q.title === 'First Quiz')!;
    const secondQuiz = results.find(q => q.title === 'Second Quiz')!;
    
    expect(firstQuiz).toBeDefined();
    expect(secondQuiz).toBeDefined();
    
    // Verify timestamps
    expect(firstQuiz.created_at).toBeInstanceOf(Date);
    expect(secondQuiz.created_at).toBeInstanceOf(Date);
    expect(secondQuiz.created_at >= firstQuiz.created_at).toBe(true);
  });

  it('should handle large number of quizzes', async () => {
    // Create multiple quizzes
    const quizData = Array.from({ length: 50 }, (_, index) => ({
      title: `Quiz ${index + 1}`,
      description: `Description for quiz ${index + 1}`
    }));

    await db.insert(quizzesTable)
      .values(quizData)
      .execute();

    const results = await getQuizzes();

    expect(results).toHaveLength(50);
    
    // Verify all quizzes are returned with correct structure
    results.forEach((quiz, index) => {
      expect(quiz.id).toBeDefined();
      expect(quiz.title).toMatch(/^Quiz \d+$/);
      expect(quiz.description).toMatch(/^Description for quiz \d+$/);
      expect(quiz.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return consistent data structure', async () => {
    await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'Test Description'
      })
      .execute();

    const results = await getQuizzes();

    expect(results).toHaveLength(1);
    
    const quiz = results[0];
    
    // Verify all required fields are present with correct types
    expect(typeof quiz.id).toBe('number');
    expect(typeof quiz.title).toBe('string');
    expect(typeof quiz.description).toBe('string');
    expect(quiz.created_at).toBeInstanceOf(Date);
    
    // Verify the structure matches Quiz schema
    expect(quiz).toHaveProperty('id');
    expect(quiz).toHaveProperty('title');
    expect(quiz).toHaveProperty('description');
    expect(quiz).toHaveProperty('created_at');
  });
});
