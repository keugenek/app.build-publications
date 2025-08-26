import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq } from 'drizzle-orm';

// Test inputs with all possible field combinations
const testInputWithDescription: CreateQuizInput = {
  title: 'JavaScript Fundamentals Quiz',
  description: 'A comprehensive quiz covering basic JavaScript concepts'
};

const testInputWithoutDescription: CreateQuizInput = {
  title: 'Math Quiz'
  // description is optional
};

const testInputWithNullDescription: CreateQuizInput = {
  title: 'Science Quiz',
  description: null
};

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz with description', async () => {
    const result = await createQuiz(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('JavaScript Fundamentals Quiz');
    expect(result.description).toEqual('A comprehensive quiz covering basic JavaScript concepts');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a quiz without description', async () => {
    const result = await createQuiz(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Math Quiz');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a quiz with null description', async () => {
    const result = await createQuiz(testInputWithNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Science Quiz');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    const result = await createQuiz(testInputWithDescription);

    // Query using proper drizzle syntax
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('JavaScript Fundamentals Quiz');
    expect(quizzes[0].description).toEqual('A comprehensive quiz covering basic JavaScript concepts');
    expect(quizzes[0].id).toEqual(result.id);
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
  });

  it('should auto-generate sequential IDs for multiple quizzes', async () => {
    const quiz1 = await createQuiz(testInputWithDescription);
    const quiz2 = await createQuiz(testInputWithoutDescription);
    const quiz3 = await createQuiz(testInputWithNullDescription);

    // Verify IDs are unique and sequential
    expect(quiz1.id).toBeGreaterThan(0);
    expect(quiz2.id).toBeGreaterThan(quiz1.id);
    expect(quiz3.id).toBeGreaterThan(quiz2.id);

    // Verify all quizzes exist in database
    const allQuizzes = await db.select()
      .from(quizzesTable)
      .execute();

    expect(allQuizzes).toHaveLength(3);
    
    // Verify each quiz has correct data
    const quiz1InDb = allQuizzes.find(q => q.id === quiz1.id);
    const quiz2InDb = allQuizzes.find(q => q.id === quiz2.id);
    const quiz3InDb = allQuizzes.find(q => q.id === quiz3.id);

    expect(quiz1InDb?.title).toEqual('JavaScript Fundamentals Quiz');
    expect(quiz1InDb?.description).toEqual('A comprehensive quiz covering basic JavaScript concepts');

    expect(quiz2InDb?.title).toEqual('Math Quiz');
    expect(quiz2InDb?.description).toBeNull();

    expect(quiz3InDb?.title).toEqual('Science Quiz');
    expect(quiz3InDb?.description).toBeNull();
  });

  it('should set created_at timestamp correctly', async () => {
    const beforeCreation = new Date();
    const result = await createQuiz(testInputWithDescription);
    const afterCreation = new Date();

    // Verify created_at is within reasonable time range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle special characters in title and description', async () => {
    const specialCharInput: CreateQuizInput = {
      title: 'Quiz with "Special" Characters & Symbols!',
      description: 'Description with émojis 🎯, quotes "test", and symbols @#$%'
    };

    const result = await createQuiz(specialCharInput);

    expect(result.title).toEqual('Quiz with "Special" Characters & Symbols!');
    expect(result.description).toEqual('Description with émojis 🎯, quotes "test", and symbols @#$%');

    // Verify in database
    const quizInDb = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizInDb[0].title).toEqual('Quiz with "Special" Characters & Symbols!');
    expect(quizInDb[0].description).toEqual('Description with émojis 🎯, quotes "test", and symbols @#$%');
  });
});
