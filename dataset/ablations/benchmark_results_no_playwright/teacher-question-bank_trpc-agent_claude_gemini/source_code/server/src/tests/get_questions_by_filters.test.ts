import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type GetQuestionsByFiltersInput } from '../schema';
import { getQuestionsByFilters } from '../handlers/get_questions_by_filters';

describe('getQuestionsByFilters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all questions when no filters are provided', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create test questions
    const questions = await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[1].id },
        { text: 'What is x+y?', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .returning()
      .execute();

    const input: GetQuestionsByFiltersInput = {};
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(3);
    expect(results.map(q => q.text)).toEqual(expect.arrayContaining([
      'What is 2+2?',
      'What is force?',
      'What is x+y?'
    ]));
  });

  it('should filter questions by single subject_id', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[1].id },
        { text: 'What is x+y?', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      subject_ids: [subjects[0].id]
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(2);
    expect(results.map(q => q.text)).toEqual(expect.arrayContaining([
      'What is 2+2?',
      'What is x+y?'
    ]));
    results.forEach(question => {
      expect(question.subject_id).toBe(subjects[0].id);
    });
  });

  it('should filter questions by multiple subject_ids', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'History' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id },
        { name: 'Ancient History', subject_id: subjects[2].id }
      ])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[1].id },
        { text: 'When was Rome founded?', subject_id: subjects[2].id, topic_id: topics[2].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      subject_ids: [subjects[0].id, subjects[1].id]
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(2);
    expect(results.map(q => q.text)).toEqual(expect.arrayContaining([
      'What is 2+2?',
      'What is force?'
    ]));
    results.forEach(question => {
      expect([subjects[0].id, subjects[1].id]).toContain(question.subject_id);
    });
  });

  it('should filter questions by single topic_id', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Geometry', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is area of circle?', subject_id: subjects[0].id, topic_id: topics[1].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[2].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      topic_ids: [topics[0].id]
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('What is 2+2?');
    expect(results[0].topic_id).toBe(topics[0].id);
  });

  it('should filter questions by multiple topic_ids', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Geometry', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is area of circle?', subject_id: subjects[0].id, topic_id: topics[1].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[2].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      topic_ids: [topics[0].id, topics[2].id]
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(2);
    expect(results.map(q => q.text)).toEqual(expect.arrayContaining([
      'What is 2+2?',
      'What is force?'
    ]));
    results.forEach(question => {
      expect([topics[0].id, topics[2].id]).toContain(question.topic_id);
    });
  });

  it('should filter questions by both subject_ids and topic_ids', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Geometry', subject_id: subjects[0].id },
        { name: 'Physics', subject_id: subjects[1].id },
        { name: 'Chemistry', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is area of circle?', subject_id: subjects[0].id, topic_id: topics[1].id },
        { text: 'What is force?', subject_id: subjects[1].id, topic_id: topics[2].id },
        { text: 'What is H2O?', subject_id: subjects[1].id, topic_id: topics[3].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      subject_ids: [subjects[1].id], // Science
      topic_ids: [topics[2].id] // Physics
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('What is force?');
    expect(results[0].subject_id).toBe(subjects[1].id);
    expect(results[0].topic_id).toBe(topics[2].id);
  });

  it('should apply limit when provided', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Mathematics' }])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([{ name: 'Algebra', subject_id: subjects[0].id }])
      .returning()
      .execute();

    // Create multiple test questions
    await db.insert(questionsTable)
      .values([
        { text: 'Question 1', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'Question 2', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'Question 3', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'Question 4', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      limit: 2
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(2);
    results.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.text).toMatch(/^Question \d$/);
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no questions match filters', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Mathematics' }])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([{ name: 'Algebra', subject_id: subjects[0].id }])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      subject_ids: [999], // Non-existent subject ID
      topic_ids: [888] // Non-existent topic ID
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should handle empty filter arrays', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Mathematics' }])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([{ name: 'Algebra', subject_id: subjects[0].id }])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {
      subject_ids: [],
      topic_ids: []
    };
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('What is 2+2?');
  });

  it('should verify all required question fields are returned', async () => {
    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([{ name: 'Mathematics' }])
      .returning()
      .execute();

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([{ name: 'Algebra', subject_id: subjects[0].id }])
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id }
      ])
      .execute();

    const input: GetQuestionsByFiltersInput = {};
    const results = await getQuestionsByFilters(input);

    expect(results).toHaveLength(1);
    const question = results[0];

    // Verify all required fields are present
    expect(question.id).toBeDefined();
    expect(typeof question.id).toBe('number');
    expect(question.text).toBe('What is 2+2?');
    expect(typeof question.text).toBe('string');
    expect(question.subject_id).toBe(subjects[0].id);
    expect(typeof question.subject_id).toBe('number');
    expect(question.topic_id).toBe(topics[0].id);
    expect(typeof question.topic_id).toBe('number');
    expect(question.created_at).toBeInstanceOf(Date);
  });
});
