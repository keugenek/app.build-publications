import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type GetQuestionsInput } from '../schema';
import { getQuestions } from '../handlers/get_questions';

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics', description: 'Math subject' },
        { name: 'Science', description: 'Science subject' }
      ])
      .returning()
      .execute();

    // Create topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', description: 'Basic algebra', subject_id: subjects[0].id },
        { name: 'Geometry', description: 'Basic geometry', subject_id: subjects[0].id },
        { name: 'Physics', description: 'Basic physics', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create questions
    await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is 2 + 2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_answer: 'B',
          explanation: 'Simple addition',
          difficulty_level: 'easy',
          subject_id: subjects[0].id,
          topic_id: topics[0].id
        },
        {
          question_text: 'What is the area of a circle?',
          option_a: 'πr²',
          option_b: '2πr',
          option_c: 'πd',
          option_d: 'r²',
          correct_answer: 'A',
          explanation: 'Area formula for circle',
          difficulty_level: 'medium',
          subject_id: subjects[0].id,
          topic_id: topics[1].id
        },
        {
          question_text: 'What is Newton\'s first law?',
          option_a: 'F = ma',
          option_b: 'Object at rest stays at rest',
          option_c: 'E = mc²',
          option_d: 'P = mv',
          correct_answer: 'B',
          explanation: 'Law of inertia',
          difficulty_level: 'hard',
          subject_id: subjects[1].id,
          topic_id: topics[2].id
        },
        {
          question_text: 'What is 5 × 3?',
          option_a: '15',
          option_b: '8',
          option_c: '12',
          option_d: '18',
          correct_answer: 'A',
          explanation: 'Simple multiplication',
          difficulty_level: 'easy',
          subject_id: subjects[0].id,
          topic_id: topics[0].id
        }
      ])
      .execute();

    return { subjects, topics };
  };

  it('should return all questions when no filters are provided', async () => {
    await createTestData();

    const result = await getQuestions();

    expect(result).toHaveLength(4);
    expect(result[0].question_text).toBeDefined();
    expect(result[0].option_a).toBeDefined();
    expect(result[0].correct_answer).toBeDefined();
    expect(result[0].difficulty_level).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no questions exist', async () => {
    const result = await getQuestions();

    expect(result).toHaveLength(0);
  });

  it('should filter questions by subject_id', async () => {
    const { subjects } = await createTestData();

    const input: GetQuestionsInput = {
      subject_id: subjects[0].id // Mathematics
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(3);
    result.forEach(question => {
      expect(question.subject_id).toBe(subjects[0].id);
    });
  });

  it('should filter questions by topic_id', async () => {
    const { topics } = await createTestData();

    const input: GetQuestionsInput = {
      topic_id: topics[0].id // Algebra
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(2);
    result.forEach(question => {
      expect(question.topic_id).toBe(topics[0].id);
    });
  });

  it('should filter questions by difficulty_level', async () => {
    await createTestData();

    const input: GetQuestionsInput = {
      difficulty_level: 'easy'
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(2);
    result.forEach(question => {
      expect(question.difficulty_level).toBe('easy');
    });
  });

  it('should filter questions by multiple criteria', async () => {
    const { subjects, topics } = await createTestData();

    const input: GetQuestionsInput = {
      subject_id: subjects[0].id,
      topic_id: topics[0].id,
      difficulty_level: 'easy'
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(2);
    result.forEach(question => {
      expect(question.subject_id).toBe(subjects[0].id);
      expect(question.topic_id).toBe(topics[0].id);
      expect(question.difficulty_level).toBe('easy');
    });
  });

  it('should apply pagination with limit', async () => {
    await createTestData();

    const input: GetQuestionsInput = {
      limit: 2
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(2);
  });

  it('should apply pagination with offset', async () => {
    await createTestData();

    // Get first 2 questions
    const firstBatch = await getQuestions({ limit: 2, offset: 0 });
    
    // Get next 2 questions
    const secondBatch = await getQuestions({ limit: 2, offset: 2 });

    expect(firstBatch).toHaveLength(2);
    expect(secondBatch).toHaveLength(2);
    
    // Ensure different questions are returned
    const firstIds = firstBatch.map(q => q.id);
    const secondIds = secondBatch.map(q => q.id);
    
    expect(firstIds).not.toEqual(secondIds);
  });

  it('should handle non-existent subject_id filter', async () => {
    await createTestData();

    const input: GetQuestionsInput = {
      subject_id: 999 // Non-existent subject
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(0);
  });

  it('should handle non-existent topic_id filter', async () => {
    await createTestData();

    const input: GetQuestionsInput = {
      topic_id: 999 // Non-existent topic
    };

    const result = await getQuestions(input);

    expect(result).toHaveLength(0);
  });

  it('should return correct question structure', async () => {
    await createTestData();

    const result = await getQuestions({ limit: 1 });

    expect(result).toHaveLength(1);
    const question = result[0];

    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('question_text');
    expect(question).toHaveProperty('option_a');
    expect(question).toHaveProperty('option_b');
    expect(question).toHaveProperty('option_c');
    expect(question).toHaveProperty('option_d');
    expect(question).toHaveProperty('correct_answer');
    expect(question).toHaveProperty('explanation');
    expect(question).toHaveProperty('difficulty_level');
    expect(question).toHaveProperty('subject_id');
    expect(question).toHaveProperty('topic_id');
    expect(question).toHaveProperty('created_at');
    expect(question).toHaveProperty('updated_at');

    expect(typeof question.id).toBe('number');
    expect(typeof question.question_text).toBe('string');
    expect(['A', 'B', 'C', 'D']).toContain(question.correct_answer);
    expect(['easy', 'medium', 'hard']).toContain(question.difficulty_level);
    expect(question.created_at).toBeInstanceOf(Date);
    expect(question.updated_at).toBeInstanceOf(Date);
  });
});
