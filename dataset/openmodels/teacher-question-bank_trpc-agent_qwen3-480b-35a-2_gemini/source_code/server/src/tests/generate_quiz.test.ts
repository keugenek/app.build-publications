import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' }
      ])
      .returning()
      .execute();
    
    // Create topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Geometry', subject_id: subjects[0].id },
        { name: 'Biology', subject_id: subjects[1].id },
        { name: 'Chemistry', subject_id: subjects[1].id }
      ])
      .returning()
      .execute();
    
    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          text: 'What is 2+2?',
          type: 'Multiple Choice',
          correct_answer: '4',
          subject_id: subjects[0].id,
          topic_id: topics[0].id
        },
        {
          text: 'What is the area of a circle?',
          type: 'Open Ended',
          correct_answer: 'πr²',
          subject_id: subjects[0].id,
          topic_id: topics[1].id
        },
        {
          text: 'What is the powerhouse of the cell?',
          type: 'Multiple Choice',
          correct_answer: 'Mitochondria',
          subject_id: subjects[1].id,
          topic_id: topics[2].id
        },
        {
          text: 'What is H2O?',
          type: 'Multiple Choice',
          correct_answer: 'Water',
          subject_id: subjects[1].id,
          topic_id: topics[3].id
        }
      ])
      .returning()
      .execute();
    
    return { subjects, topics, questions };
  };

  it('should generate a quiz with questions from specified subjects', async () => {
    const { subjects, questions } = await createTestData();
    
    const input: GenerateQuizInput = {
      subject_ids: [subjects[0].id], // Only Mathematics
      num_questions: 2
    };
    
    const result = await generateQuiz(input);
    
    // Check quiz was created
    expect(result.quiz).toBeDefined();
    expect(result.quiz.id).toBeDefined();
    expect(result.quiz.name).toContain('Quiz');
    expect(result.quiz.created_at).toBeInstanceOf(Date);
    
    // Check questions were selected
    expect(result.questions).toHaveLength(2);
    
    // All questions should be from Mathematics subject
    result.questions.forEach(question => {
      expect(question.subject_id).toBe(subjects[0].id);
    });
  });

  it('should generate a quiz with questions from specified subjects and topics', async () => {
    const { subjects, topics, questions } = await createTestData();
    
    const input: GenerateQuizInput = {
      subject_ids: [subjects[0].id], // Mathematics
      topic_ids: [topics[0].id], // Algebra only
      num_questions: 1
    };
    
    const result = await generateQuiz(input);
    
    // Check quiz was created
    expect(result.quiz).toBeDefined();
    expect(result.questions).toHaveLength(1);
    
    // The question should be from Mathematics and Algebra
    expect(result.questions[0].subject_id).toBe(subjects[0].id);
    expect(result.questions[0].topic_id).toBe(topics[0].id);
    expect(result.questions[0].text).toBe('What is 2+2?');
  });

  it('should respect the num_questions limit', async () => {
    const { subjects } = await createTestData();
    
    const input: GenerateQuizInput = {
      subject_ids: [subjects[0].id, subjects[1].id], // Both subjects
      num_questions: 3
    };
    
    const result = await generateQuiz(input);
    
    expect(result.questions).toHaveLength(3);
  });

  it('should throw an error when no questions match the criteria', async () => {
    const input: GenerateQuizInput = {
      subject_ids: [999], // Non-existent subject
      num_questions: 1
    };
    
    await expect(generateQuiz(input)).rejects.toThrow('No questions found matching the criteria');
  });
});
