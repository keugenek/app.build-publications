import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { getQuizzes } from '../handlers/get_quizzes';

describe('getQuizzes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no quizzes exist', async () => {
    const result = await getQuizzes();

    expect(result).toEqual([]);
  });

  it('should fetch all quizzes from database', async () => {
    // Create test quizzes
    await db.insert(quizzesTable)
      .values([
        {
          title: 'Math Quiz',
          description: 'Basic mathematics questions'
        },
        {
          title: 'Science Quiz',
          description: 'General science questions'
        },
        {
          title: 'History Quiz',
          description: null // Test nullable description
        }
      ])
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    
    // Check that all required fields are present
    result.forEach(quiz => {
      expect(quiz.id).toBeDefined();
      expect(typeof quiz.id).toBe('number');
      expect(typeof quiz.title).toBe('string');
      expect(quiz.created_at).toBeInstanceOf(Date);
      // Description can be string or null
      expect(quiz.description === null || typeof quiz.description === 'string').toBe(true);
    });

    // Verify specific quiz data
    const titles = result.map(quiz => quiz.title);
    expect(titles).toContain('Math Quiz');
    expect(titles).toContain('Science Quiz');
    expect(titles).toContain('History Quiz');
  });

  it('should return quizzes ordered by creation date (newest first)', async () => {
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

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(quizzesTable)
      .values({
        title: 'Third Quiz',
        description: 'Created third'
      })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date descending (newest first)
    expect(result[0].title).toBe('Third Quiz');
    expect(result[1].title).toBe('Second Quiz');
    expect(result[2].title).toBe('First Quiz');

    // Verify timestamp ordering
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle quizzes with null descriptions', async () => {
    await db.insert(quizzesTable)
      .values([
        {
          title: 'Quiz with Description',
          description: 'This has a description'
        },
        {
          title: 'Quiz without Description',
          description: null
        }
      ])
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(2);
    
    const quizWithDesc = result.find(q => q.title === 'Quiz with Description');
    const quizWithoutDesc = result.find(q => q.title === 'Quiz without Description');

    expect(quizWithDesc?.description).toBe('This has a description');
    expect(quizWithoutDesc?.description).toBe(null);
  });

  it('should return valid quiz schema structure', async () => {
    await db.insert(quizzesTable)
      .values({
        title: 'Sample Quiz',
        description: 'Sample description'
      })
      .execute();

    const result = await getQuizzes();
    const quiz = result[0];

    // Verify all expected fields are present with correct types
    expect(typeof quiz.id).toBe('number');
    expect(typeof quiz.title).toBe('string');
    expect(quiz.description === null || typeof quiz.description === 'string').toBe(true);
    expect(quiz.created_at).toBeInstanceOf(Date);

    // Verify no unexpected fields are present
    const expectedKeys = ['id', 'title', 'description', 'created_at'];
    const actualKeys = Object.keys(quiz);
    expect(actualKeys.sort()).toEqual(expectedKeys.sort());
  });
});
