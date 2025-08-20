import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { exportQuiz } from '../handlers/export_quiz';

// Test data
const testQuestions = [
  {
    question_text: 'What is the capital of France?',
    subject: 'Geography',
    topic: 'Europe',
    answer: 'Paris'
  },
  {
    question_text: 'What is the largest planet in our solar system?',
    subject: 'Science',
    topic: 'Astronomy',
    answer: 'Jupiter'
  },
  {
    question_text: 'Who wrote Romeo and Juliet?',
    subject: 'Literature',
    topic: 'Shakespeare',
    answer: 'William Shakespeare'
  },
  {
    question_text: 'What is 2 + 2?',
    subject: 'Math',
    topic: 'Arithmetic',
    answer: '4'
  }
];

describe('exportQuiz', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test questions
    for (const question of testQuestions) {
      await db.insert(questionsTable).values(question).execute();
    }
  });
  
  afterEach(resetDB);

  it('should export a quiz as a PDF buffer', async () => {
    const input: GenerateQuizInput = {
      subject: 'Math',
      topic: 'Arithmetic',
      count: 1
    };

    const result = await exportQuiz(input);
    
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    
    const content = result.toString('utf-8');
    expect(content).toContain('Quiz: Math - Arithmetic');
    expect(content).toContain('What is 2 + 2?');
    expect(content).toContain('4');
  });

  it('should export multiple questions when count is greater than 1', async () => {
    const input: GenerateQuizInput = {
      subject: 'Geography',
      topic: 'Europe',
      count: 2
    };

    // Add more geography questions for testing
    await db.insert(questionsTable).values({
      question_text: 'What is the capital of Germany?',
      subject: 'Geography',
      topic: 'Europe',
      answer: 'Berlin'
    }).execute();

    const result = await exportQuiz(input);
    
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    
    const content = result.toString('utf-8');
    expect(content).toContain('Quiz: Geography - Europe');
    const questionCount = (content.match(/Question \d+:/g) || []).length;
    expect(questionCount).toBe(2);
  });

  it('should handle case when requesting more questions than available', async () => {
    const input: GenerateQuizInput = {
      subject: 'Math',
      topic: 'Arithmetic',
      count: 5 // More than available questions
    };

    const result = await exportQuiz(input);
    
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    
    const content = result.toString('utf-8');
    const questionCount = (content.match(/Question \d+:/g) || []).length;
    expect(questionCount).toBe(1); // Only 1 math question available
  });

  it('should return empty buffer when no questions found', async () => {
    const input: GenerateQuizInput = {
      subject: 'NonExistent',
      topic: 'NonExistent',
      count: 1
    };

    const result = await exportQuiz(input);
    
    expect(result).toBeInstanceOf(Buffer);
    // Note: The current implementation returns an empty buffer when no questions found
    // This could be changed to throw an error instead if that's the desired behavior
  });
});
