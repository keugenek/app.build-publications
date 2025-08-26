import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GenerateQuizInput, type CreateQuestionInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq } from 'drizzle-orm';

// Test data
const sampleQuestions: CreateQuestionInput[] = [
  {
    question_text: 'What is the capital of France?',
    subject: 'Geography',
    topic: 'Europe',
    answer: 'Paris'
  },
  {
    question_text: 'What is the capital of Germany?',
    subject: 'Geography',
    topic: 'Europe',
    answer: 'Berlin'
  },
  {
    question_text: 'What is the capital of Japan?',
    subject: 'Geography',
    topic: 'Asia',
    answer: 'Tokyo'
  },
  {
    question_text: 'What is 2+2?',
    subject: 'Math',
    topic: 'Arithmetic',
    answer: '4'
  },
  {
    question_text: 'What is the chemical symbol for water?',
    subject: 'Science',
    topic: 'Chemistry',
    answer: 'H2O'
  }
];

describe('generateQuiz', () => {
  beforeEach(async () => {
    await createDB();
    // Insert sample questions for testing
    for (const question of sampleQuestions) {
      await db.insert(questionsTable)
        .values(question)
        .execute();
    }
  });
  
  afterEach(resetDB);

  it('should generate a quiz with specified number of questions', async () => {
    const input: GenerateQuizInput = {
      subject: 'Geography',
      topic: 'Europe',
      count: 2
    };

    const result = await generateQuiz(input);

    // Check that we got the requested number of questions
    expect(result).toHaveLength(2);
    
    // Check that all questions are from the correct subject and topic
    result.forEach(question => {
      expect(question.subject).toEqual('Geography');
      expect(question.topic).toEqual('Europe');
    });
    
    // Check that all required fields are present
    result.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.question_text).toBeDefined();
      expect(question.answer).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
      expect(question.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return all questions when count exceeds available questions', async () => {
    const input: GenerateQuizInput = {
      subject: 'Geography',
      topic: 'Europe',
      count: 10 // More than available
    };

    const result = await generateQuiz(input);

    // Should return all matching questions (2 in this case)
    expect(result).toHaveLength(2);
    
    result.forEach(question => {
      expect(question.subject).toEqual('Geography');
      expect(question.topic).toEqual('Europe');
    });
  });

  it('should return empty array when no questions match criteria', async () => {
    const input: GenerateQuizInput = {
      subject: 'NonExistentSubject',
      topic: 'NonExistentTopic',
      count: 5
    };

    const result = await generateQuiz(input);
    
    expect(result).toHaveLength(0);
  });

  it('should return questions from correct subject and topic only', async () => {
    const input: GenerateQuizInput = {
      subject: 'Science',
      topic: 'Chemistry',
      count: 1
    };

    const result = await generateQuiz(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].subject).toEqual('Science');
    expect(result[0].topic).toEqual('Chemistry');
    expect(result[0].question_text).toEqual('What is the chemical symbol for water?');
    expect(result[0].answer).toEqual('H2O');
  });
});
