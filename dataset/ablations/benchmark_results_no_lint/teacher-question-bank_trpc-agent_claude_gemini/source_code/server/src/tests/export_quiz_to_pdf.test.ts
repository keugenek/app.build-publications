import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type ExportQuizToPdfInput } from '../schema';
import { exportQuizToPdf } from '../handlers/export_quiz_to_pdf';

// Test data setup
const createTestData = async () => {
  // Create a subject
  const subjectResult = await db.insert(subjectsTable)
    .values({
      name: 'Mathematics',
      description: 'Basic math concepts'
    })
    .returning()
    .execute();
  const subject = subjectResult[0];

  // Create a topic
  const topicResult = await db.insert(topicsTable)
    .values({
      name: 'Algebra',
      description: 'Basic algebraic operations',
      subject_id: subject.id
    })
    .returning()
    .execute();
  const topic = topicResult[0];

  // Create questions
  const questionsData = [
    {
      question_text: 'What is 2 + 2?',
      answer_text: '4',
      subject_id: subject.id,
      topic_id: topic.id
    },
    {
      question_text: 'Solve for x: 2x + 4 = 10',
      answer_text: 'x = 3 (because 2x = 10 - 4 = 6, so x = 6/2 = 3)',
      subject_id: subject.id,
      topic_id: topic.id
    },
    {
      question_text: 'What is the square root of 16?',
      answer_text: '4 (because 4 × 4 = 16)',
      subject_id: subject.id,
      topic_id: topic.id
    }
  ];

  const questionResults = await db.insert(questionsTable)
    .values(questionsData)
    .returning()
    .execute();

  // Create a quiz
  const quizResult = await db.insert(quizzesTable)
    .values({
      title: 'Basic Math Quiz',
      subject_id: subject.id,
      topic_id: topic.id,
      question_count: questionResults.length
    })
    .returning()
    .execute();
  const quiz = quizResult[0];

  // Link questions to quiz with proper order
  const quizQuestionsData = questionResults.map((question, index) => ({
    quiz_id: quiz.id,
    question_id: question.id,
    order_index: index + 1
  }));

  await db.insert(quizQuestionsTable)
    .values(quizQuestionsData)
    .execute();

  return { subject, topic, questions: questionResults, quiz };
};

describe('exportQuizToPdf', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export quiz to PDF without answers', async () => {
    const { quiz } = await createTestData();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuizToPdf(input);

    // Verify result is a Buffer
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify it's a valid PDF (starts with PDF header)
    const pdfHeader = result.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should export quiz to PDF with answers', async () => {
    const { quiz } = await createTestData();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz.id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    // Verify result is a Buffer
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify it's a valid PDF
    const pdfHeader = result.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    // PDF with answers should be larger than without answers
    const inputWithoutAnswers: ExportQuizToPdfInput = {
      quiz_id: quiz.id,
      include_answers: false
    };
    const resultWithoutAnswers = await exportQuizToPdf(inputWithoutAnswers);
    
    expect(result.length).toBeGreaterThan(resultWithoutAnswers.length);
  });

  it('should handle default value for include_answers', async () => {
    const { quiz } = await createTestData();

    // Test with input that doesn't specify include_answers (should default to false)
    const input = { quiz_id: quiz.id } as ExportQuizToPdfInput;

    const result = await exportQuizToPdf(input);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    const pdfHeader = result.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should throw error for non-existent quiz', async () => {
    const input: ExportQuizToPdfInput = {
      quiz_id: 99999,
      include_answers: false
    };

    await expect(exportQuizToPdf(input)).rejects.toThrow(/Quiz with id 99999 not found/i);
  });

  it('should handle quiz with single question', async () => {
    // Create minimal test data with just one question
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject', description: null })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Test Topic', description: null, subject_id: subject.id })
      .returning()
      .execute();
    const topic = topicResult[0];

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Single test question?',
        answer_text: 'Single test answer',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();
    const question = questionResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Single Question Quiz',
        subject_id: subject.id,
        topic_id: topic.id,
        question_count: 1
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question_id: question.id,
        order_index: 1
      })
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz.id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    const pdfHeader = result.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });

  it('should handle quiz with long question and answer text', async () => {
    const { subject, topic } = await createTestData();

    // Create a question with very long text
    const longQuestionText = 'This is a very long question that should test the word wrapping functionality of the PDF generator. '.repeat(10);
    const longAnswerText = 'This is a very long answer that should also test the word wrapping functionality and demonstrate how the PDF handles extended content. '.repeat(10);

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: longQuestionText,
        answer_text: longAnswerText,
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();
    const question = questionResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Long Text Quiz',
        subject_id: subject.id,
        topic_id: topic.id,
        question_count: 1
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question_id: question.id,
        order_index: 1
      })
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz.id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    const pdfHeader = result.slice(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');
  });
});
