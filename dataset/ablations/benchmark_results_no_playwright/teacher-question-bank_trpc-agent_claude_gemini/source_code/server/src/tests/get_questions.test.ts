import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { getQuestions } from '../handlers/get_questions';

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no questions exist', async () => {
    const result = await getQuestions();

    expect(result).toEqual([]);
  });

  it('should return all questions when they exist', async () => {
    // Create prerequisite subject
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();

    // Create prerequisite topic
    const [topic] = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject.id })
      .returning()
      .execute();

    // Create test questions
    await db.insert(questionsTable)
      .values([
        {
          text: 'What is 2 + 2?',
          subject_id: subject.id,
          topic_id: topic.id
        },
        {
          text: 'What is 3 × 4?',
          subject_id: subject.id,
          topic_id: topic.id
        }
      ])
      .execute();

    const result = await getQuestions();

    expect(result).toHaveLength(2);
    expect(result[0].text).toEqual('What is 2 + 2?');
    expect(result[0].subject_id).toEqual(subject.id);
    expect(result[0].topic_id).toEqual(topic.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].text).toEqual('What is 3 × 4?');
    expect(result[1].subject_id).toEqual(subject.id);
    expect(result[1].topic_id).toEqual(topic.id);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return questions from multiple subjects and topics', async () => {
    // Create multiple subjects
    const [mathSubject] = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();

    const [scienceSubject] = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning()
      .execute();

    // Create multiple topics
    const [algebraTopic] = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: mathSubject.id })
      .returning()
      .execute();

    const [physicsTopic] = await db.insert(topicsTable)
      .values({ name: 'Physics', subject_id: scienceSubject.id })
      .returning()
      .execute();

    // Create questions across different subjects and topics
    await db.insert(questionsTable)
      .values([
        {
          text: 'Solve for x: x + 5 = 10',
          subject_id: mathSubject.id,
          topic_id: algebraTopic.id
        },
        {
          text: 'What is the speed of light?',
          subject_id: scienceSubject.id,
          topic_id: physicsTopic.id
        },
        {
          text: 'What is a quadratic equation?',
          subject_id: mathSubject.id,
          topic_id: algebraTopic.id
        }
      ])
      .execute();

    const result = await getQuestions();

    expect(result).toHaveLength(3);

    // Verify all questions are present
    const questionTexts = result.map(q => q.text);
    expect(questionTexts).toContain('Solve for x: x + 5 = 10');
    expect(questionTexts).toContain('What is the speed of light?');
    expect(questionTexts).toContain('What is a quadratic equation?');

    // Verify subject and topic associations
    const mathQuestions = result.filter(q => q.subject_id === mathSubject.id);
    const scienceQuestions = result.filter(q => q.subject_id === scienceSubject.id);

    expect(mathQuestions).toHaveLength(2);
    expect(scienceQuestions).toHaveLength(1);

    mathQuestions.forEach(q => {
      expect(q.topic_id).toEqual(algebraTopic.id);
    });

    scienceQuestions.forEach(q => {
      expect(q.topic_id).toEqual(physicsTopic.id);
    });
  });

  it('should return questions with all required fields', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'History' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ name: 'World War II', subject_id: subject.id })
      .returning()
      .execute();

    // Create a test question
    await db.insert(questionsTable)
      .values({
        text: 'When did World War II end?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .execute();

    const result = await getQuestions();

    expect(result).toHaveLength(1);
    const question = result[0];

    // Verify all required fields are present and have correct types
    expect(typeof question.id).toBe('number');
    expect(typeof question.text).toBe('string');
    expect(typeof question.subject_id).toBe('number');
    expect(typeof question.topic_id).toBe('number');
    expect(question.created_at).toBeInstanceOf(Date);

    // Verify field values
    expect(question.text).toEqual('When did World War II end?');
    expect(question.subject_id).toEqual(subject.id);
    expect(question.topic_id).toEqual(topic.id);
  });
});
