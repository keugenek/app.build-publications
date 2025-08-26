import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { exportQuizToPDF } from '../handlers/export_quiz';
import { resetDB, createDB } from '../helpers';
import { type Quiz, type Question } from '../schema';

describe('exportQuizToPDF', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a PDF buffer from quiz data', async () => {
    // Test quiz data
    const testQuiz: Quiz = {
      id: 1,
      name: 'Sample Quiz',
      created_at: new Date()
    };

    const testQuestions: Question[] = [
      {
        id: 1,
        text: 'What is the capital of France?',
        answer: 'Paris',
        subject_id: 1,
        topic_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        text: 'What is 2 + 2?',
        answer: '4',
        subject_id: 1,
        topic_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const pdfBuffer = await exportQuizToPDF(testQuiz, testQuestions);
    
    // Check that we get a Buffer back
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Check that it starts with the PDF magic number
    const pdfHeader = pdfBuffer.subarray(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should include quiz name and questions in the PDF', async () => {
    // Test with minimal data
    const testQuiz: Quiz = {
      id: 1,
      name: 'Test Quiz',
      created_at: new Date('2023-01-01')
    };

    const testQuestions: Question[] = [
      {
        id: 1,
        text: 'Sample question?',
        answer: 'Sample answer',
        subject_id: 1,
        topic_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    const pdfBuffer = await exportQuizToPDF(testQuiz, testQuestions);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle empty questions array', async () => {
    const testQuiz: Quiz = {
      id: 1,
      name: 'Empty Quiz',
      created_at: new Date()
    };

    const pdfBuffer = await exportQuizToPDF(testQuiz, []);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
