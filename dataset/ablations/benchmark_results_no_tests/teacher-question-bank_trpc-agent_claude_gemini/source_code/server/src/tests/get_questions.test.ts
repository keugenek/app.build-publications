import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  subjectsTable, 
  topicsTable, 
  questionsTable, 
  multipleChoiceOptionsTable 
} from '../db/schema';
import { type QuestionFilters } from '../schema';
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
        { name: 'Algebra', description: 'Algebra topic', subject_id: subjects[0].id },
        { name: 'Geometry', description: 'Geometry topic', subject_id: subjects[0].id },
        { name: 'Biology', description: 'Biology topic', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is 2 + 2?',
          subject_id: subjects[0].id,
          topic_id: topics[0].id,
          type: 'multiple-choice',
          answer: '4'
        },
        {
          question_text: 'What is the area of a circle?',
          subject_id: subjects[0].id,
          topic_id: topics[1].id,
          type: 'short-answer',
          answer: 'π × r²'
        },
        {
          question_text: 'Is mitosis cell division?',
          subject_id: subjects[1].id,
          topic_id: topics[2].id,
          type: 'true-false',
          answer: 'true'
        },
        {
          question_text: 'Explain photosynthesis',
          subject_id: subjects[1].id,
          topic_id: topics[2].id,
          type: 'open-ended',
          answer: 'Process by which plants convert light energy to chemical energy'
        }
      ])
      .returning()
      .execute();

    // Create multiple choice options for the first question
    await db.insert(multipleChoiceOptionsTable)
      .values([
        { question_id: questions[0].id, option_text: '3', is_correct: false },
        { question_id: questions[0].id, option_text: '4', is_correct: true },
        { question_id: questions[0].id, option_text: '5', is_correct: false },
        { question_id: questions[0].id, option_text: '6', is_correct: false }
      ])
      .execute();

    return { subjects, topics, questions };
  };

  it('should return all questions when no filters are provided', async () => {
    await createTestData();

    const result = await getQuestions();

    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('question_text');
    expect(result[0]).toHaveProperty('subject_id');
    expect(result[0]).toHaveProperty('topic_id');
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('answer');
    expect(result[0]).toHaveProperty('created_at');
    expect(result[0]).toHaveProperty('updated_at');
    expect(result[0]).toHaveProperty('options');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should include multiple choice options for multiple-choice questions', async () => {
    await createTestData();

    const result = await getQuestions();
    
    // Find the multiple choice question
    const multipleChoiceQuestion = result.find(q => q.type === 'multiple-choice');
    
    expect(multipleChoiceQuestion).toBeDefined();
    expect(multipleChoiceQuestion!.options).toHaveLength(4);
    expect(multipleChoiceQuestion!.options![0]).toHaveProperty('option_text');
    expect(multipleChoiceQuestion!.options![0]).toHaveProperty('is_correct');
    expect(multipleChoiceQuestion!.options![0].created_at).toBeInstanceOf(Date);
    
    // Check that correct answer is marked
    const correctOption = multipleChoiceQuestion!.options!.find(opt => opt.is_correct);
    expect(correctOption).toBeDefined();
    expect(correctOption!.option_text).toBe('4');
  });

  it('should return empty options array for non-multiple-choice questions', async () => {
    await createTestData();

    const result = await getQuestions();
    
    // Find a non-multiple-choice question
    const shortAnswerQuestion = result.find(q => q.type === 'short-answer');
    
    expect(shortAnswerQuestion).toBeDefined();
    expect(shortAnswerQuestion!.options).toHaveLength(0);
  });

  it('should filter questions by subject_id', async () => {
    const { subjects } = await createTestData();

    const filters: QuestionFilters = {
      subject_id: subjects[0].id // Math subject
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(2);
    result.forEach(question => {
      expect(question.subject_id).toBe(subjects[0].id);
    });
  });

  it('should filter questions by topic_id', async () => {
    const { topics } = await createTestData();

    const filters: QuestionFilters = {
      topic_id: topics[2].id // Biology topic
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(2);
    result.forEach(question => {
      expect(question.topic_id).toBe(topics[2].id);
    });
  });

  it('should filter questions by type', async () => {
    await createTestData();

    const filters: QuestionFilters = {
      type: 'multiple-choice'
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('multiple-choice');
    expect(result[0].options).toHaveLength(4);
  });

  it('should filter questions by multiple criteria', async () => {
    const { subjects, topics } = await createTestData();

    const filters: QuestionFilters = {
      subject_id: subjects[1].id, // Science subject
      type: 'true-false'
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(1);
    expect(result[0].subject_id).toBe(subjects[1].id);
    expect(result[0].type).toBe('true-false');
    expect(result[0].question_text).toBe('Is mitosis cell division?');
  });

  it('should return empty array when no questions match filters', async () => {
    await createTestData();

    const filters: QuestionFilters = {
      subject_id: 999, // Non-existent subject
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no questions exist', async () => {
    // Don't create any test data

    const result = await getQuestions();

    expect(result).toHaveLength(0);
  });

  it('should handle all question types correctly', async () => {
    await createTestData();

    const result = await getQuestions();

    const types = result.map(q => q.type);
    expect(types).toContain('multiple-choice');
    expect(types).toContain('short-answer');
    expect(types).toContain('true-false');
    expect(types).toContain('open-ended');
  });

  it('should handle filtering by non-existent topic_id', async () => {
    await createTestData();

    const filters: QuestionFilters = {
      topic_id: 999
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(0);
  });

  it('should handle filtering by non-existent question type', async () => {
    await createTestData();

    const filters: QuestionFilters = {
      // @ts-expect-error - Testing invalid type
      type: 'invalid-type'
    };

    const result = await getQuestions(filters);

    expect(result).toHaveLength(0);
  });
});
