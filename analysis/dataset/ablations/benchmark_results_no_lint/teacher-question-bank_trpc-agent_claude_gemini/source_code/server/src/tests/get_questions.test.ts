import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { getQuestions, getQuestionsByTopic, getQuestionsBySubject } from '../handlers/get_questions';

describe('getQuestions handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const setupTestData = async () => {
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
        { name: 'Algebra', description: 'Algebra topic', subject_id: subjects[0].id },
        { name: 'Geometry', description: 'Geometry topic', subject_id: subjects[0].id },
        { name: 'Physics', description: 'Physics topic', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is 2 + 2?',
          answer_text: '4',
          subject_id: subjects[0].id,
          topic_id: topics[0].id
        },
        {
          question_text: 'What is x in 2x = 8?',
          answer_text: '4',
          subject_id: subjects[0].id,
          topic_id: topics[0].id
        },
        {
          question_text: 'What is the area of a square with side 5?',
          answer_text: '25',
          subject_id: subjects[0].id,
          topic_id: topics[1].id
        },
        {
          question_text: 'What is the speed of light?',
          answer_text: '299,792,458 m/s',
          subject_id: subjects[1].id,
          topic_id: topics[2].id
        }
      ])
      .returning()
      .execute();

    return { subjects, topics, questions };
  };

  describe('getQuestions', () => {
    it('should return empty array when no questions exist', async () => {
      const result = await getQuestions();
      expect(result).toEqual([]);
    });

    it('should return all questions', async () => {
      const { questions } = await setupTestData();
      
      const result = await getQuestions();
      
      expect(result).toHaveLength(4);
      expect(result.map(q => q.question_text)).toContain('What is 2 + 2?');
      expect(result.map(q => q.question_text)).toContain('What is x in 2x = 8?');
      expect(result.map(q => q.question_text)).toContain('What is the area of a square with side 5?');
      expect(result.map(q => q.question_text)).toContain('What is the speed of light?');
    });

    it('should return questions with all required fields', async () => {
      await setupTestData();
      
      const result = await getQuestions();
      
      expect(result.length).toBeGreaterThan(0);
      const question = result[0];
      expect(question.id).toBeDefined();
      expect(question.question_text).toBeDefined();
      expect(question.answer_text).toBeDefined();
      expect(question.subject_id).toBeDefined();
      expect(question.topic_id).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  describe('getQuestionsByTopic', () => {
    it('should return empty array when no questions exist for topic', async () => {
      const { topics } = await setupTestData();
      
      // Use a topic that exists but has no questions (create an empty topic)
      const emptyTopic = await db.insert(topicsTable)
        .values({ name: 'Empty Topic', description: null, subject_id: topics[0].subject_id })
        .returning()
        .execute();
      
      const result = await getQuestionsByTopic(emptyTopic[0].id);
      expect(result).toEqual([]);
    });

    it('should return questions for specific topic', async () => {
      const { topics } = await setupTestData();
      
      // Get questions for Algebra topic (should have 2 questions)
      const result = await getQuestionsByTopic(topics[0].id);
      
      expect(result).toHaveLength(2);
      expect(result[0].topic_id).toEqual(topics[0].id);
      expect(result[1].topic_id).toEqual(topics[0].id);
      expect(result.map(q => q.question_text)).toContain('What is 2 + 2?');
      expect(result.map(q => q.question_text)).toContain('What is x in 2x = 8?');
    });

    it('should return questions only for specified topic', async () => {
      const { topics } = await setupTestData();
      
      // Get questions for Geometry topic (should have 1 question)
      const result = await getQuestionsByTopic(topics[1].id);
      
      expect(result).toHaveLength(1);
      expect(result[0].topic_id).toEqual(topics[1].id);
      expect(result[0].question_text).toEqual('What is the area of a square with side 5?');
    });

    it('should return questions with all required fields', async () => {
      const { topics } = await setupTestData();
      
      const result = await getQuestionsByTopic(topics[0].id);
      
      expect(result.length).toBeGreaterThan(0);
      const question = result[0];
      expect(question.id).toBeDefined();
      expect(question.question_text).toBeDefined();
      expect(question.answer_text).toBeDefined();
      expect(question.subject_id).toBeDefined();
      expect(question.topic_id).toEqual(topics[0].id);
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  describe('getQuestionsBySubject', () => {
    it('should return empty array when no questions exist for subject', async () => {
      const { subjects } = await setupTestData();
      
      // Create a subject with no questions
      const emptySubject = await db.insert(subjectsTable)
        .values({ name: 'Empty Subject', description: null })
        .returning()
        .execute();
      
      const result = await getQuestionsBySubject(emptySubject[0].id);
      expect(result).toEqual([]);
    });

    it('should return all questions for specific subject', async () => {
      const { subjects } = await setupTestData();
      
      // Get questions for Mathematics subject (should have 3 questions)
      const result = await getQuestionsBySubject(subjects[0].id);
      
      expect(result).toHaveLength(3);
      expect(result.every(q => q.subject_id === subjects[0].id)).toBe(true);
      expect(result.map(q => q.question_text)).toContain('What is 2 + 2?');
      expect(result.map(q => q.question_text)).toContain('What is x in 2x = 8?');
      expect(result.map(q => q.question_text)).toContain('What is the area of a square with side 5?');
    });

    it('should return questions only for specified subject', async () => {
      const { subjects } = await setupTestData();
      
      // Get questions for Science subject (should have 1 question)
      const result = await getQuestionsBySubject(subjects[1].id);
      
      expect(result).toHaveLength(1);
      expect(result[0].subject_id).toEqual(subjects[1].id);
      expect(result[0].question_text).toEqual('What is the speed of light?');
    });

    it('should return questions with all required fields', async () => {
      const { subjects } = await setupTestData();
      
      const result = await getQuestionsBySubject(subjects[0].id);
      
      expect(result.length).toBeGreaterThan(0);
      const question = result[0];
      expect(question.id).toBeDefined();
      expect(question.question_text).toBeDefined();
      expect(question.answer_text).toBeDefined();
      expect(question.subject_id).toEqual(subjects[0].id);
      expect(question.topic_id).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  describe('error handling', () => {
    it('should handle invalid topic id gracefully', async () => {
      // Query with non-existent topic ID should return empty array, not throw
      const result = await getQuestionsByTopic(99999);
      expect(result).toEqual([]);
    });

    it('should handle invalid subject id gracefully', async () => {
      // Query with non-existent subject ID should return empty array, not throw
      const result = await getQuestionsBySubject(99999);
      expect(result).toEqual([]);
    });
  });
});
