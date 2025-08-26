import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { getQuestions, getQuestionsBySubject, getQuestionsByTopic } from '../handlers/get_questions';

describe('getQuestions', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning();
    
    const subjectId = subjectResult[0].id;
    
    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subjectId })
      .returning();
    
    const topicId = topicResult[0].id;
    
    await db.insert(questionsTable)
      .values([
        {
          text: 'What is 2 + 2?',
          answer: '4',
          subject_id: subjectId,
          topic_id: topicId
        },
        {
          text: 'What is 5 * 3?',
          answer: '15',
          subject_id: subjectId,
          topic_id: topicId
        }
      ]);
  });

  afterEach(resetDB);

  it('should fetch all questions', async () => {
    const questions = await getQuestions();
    
    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      text: 'What is 2 + 2?',
      answer: '4'
    });
    expect(questions[1]).toMatchObject({
      text: 'What is 5 * 3?',
      answer: '15'
    });
    
    // Check that dates are properly converted
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch questions by subject', async () => {
    // First get the subject ID
    const subjects = await db.select().from(subjectsTable);
    const subjectId = subjects[0].id;
    
    const questions = await getQuestionsBySubject(subjectId);
    
    expect(questions).toHaveLength(2);
    expect(questions[0].subject_id).toBe(subjectId);
    expect(questions[1].subject_id).toBe(subjectId);
  });

  it('should fetch questions by topic', async () => {
    // First get the topic ID
    const topics = await db.select().from(topicsTable);
    const topicId = topics[0].id;
    
    const questions = await getQuestionsByTopic(topicId);
    
    expect(questions).toHaveLength(2);
    expect(questions[0].topic_id).toBe(topicId);
    expect(questions[1].topic_id).toBe(topicId);
  });

  it('should return empty array when no questions match subject', async () => {
    // Create a new subject with no questions
    const newSubject = await db.insert(subjectsTable)
      .values({ name: 'Physics' })
      .returning();
    
    const questions = await getQuestionsBySubject(newSubject[0].id);
    
    expect(questions).toHaveLength(0);
  });

  it('should return empty array when no questions match topic', async () => {
    // Create a new topic with no questions
    const subjects = await db.select().from(subjectsTable);
    const newTopic = await db.insert(topicsTable)
      .values({ name: 'Calculus', subject_id: subjects[0].id })
      .returning();
    
    const questions = await getQuestionsByTopic(newTopic[0].id);
    
    expect(questions).toHaveLength(0);
  });
});
