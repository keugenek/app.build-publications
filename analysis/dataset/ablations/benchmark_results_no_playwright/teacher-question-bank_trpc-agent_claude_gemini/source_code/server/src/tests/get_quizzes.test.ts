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
    expect(result).toHaveLength(0);
  });

  it('should return single quiz', async () => {
    // Create a test quiz
    await db.insert(quizzesTable)
      .values({
        title: 'Math Quiz 1'
      })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Math Quiz 1');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple quizzes', async () => {
    // Create multiple test quizzes
    await db.insert(quizzesTable)
      .values([
        { title: 'History Quiz' },
        { title: 'Science Quiz' },
        { title: 'English Quiz' }
      ])
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    
    const titles = result.map(quiz => quiz.title);
    expect(titles).toContain('History Quiz');
    expect(titles).toContain('Science Quiz');
    expect(titles).toContain('English Quiz');

    // Verify all quizzes have required fields
    result.forEach(quiz => {
      expect(quiz.id).toBeDefined();
      expect(quiz.title).toBeDefined();
      expect(quiz.created_at).toBeInstanceOf(Date);
      expect(typeof quiz.title).toBe('string');
      expect(typeof quiz.id).toBe('number');
    });
  });

  it('should return quizzes in database insertion order', async () => {
    // Insert quizzes with distinct titles to verify order
    await db.insert(quizzesTable)
      .values({ title: 'First Quiz' })
      .execute();

    await db.insert(quizzesTable)
      .values({ title: 'Second Quiz' })
      .execute();

    await db.insert(quizzesTable)
      .values({ title: 'Third Quiz' })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    // Verify they are returned in insertion order (by ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    expect(result[0].title).toEqual('First Quiz');
    expect(result[1].title).toEqual('Second Quiz');
    expect(result[2].title).toEqual('Third Quiz');
  });

  it('should handle quizzes with special characters in title', async () => {
    const specialTitle = "Math Quiz: Algebra & Geometry (2024) - Test #1";
    
    await db.insert(quizzesTable)
      .values({ title: specialTitle })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual(specialTitle);
  });

  it('should verify created_at timestamps are recent', async () => {
    const beforeInsert = new Date();
    
    await db.insert(quizzesTable)
      .values({ title: 'Timestamp Test Quiz' })
      .execute();

    const afterInsert = new Date();
    const result = await getQuizzes();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].created_at >= beforeInsert).toBe(true);
    expect(result[0].created_at <= afterInsert).toBe(true);
  });
});
