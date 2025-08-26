import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type ExportQuizInput } from '../schema';
import { exportQuiz } from '../handlers/export_quiz';

// Test data setup
const testSubject = {
  name: 'Mathematics',
  description: 'Basic math concepts'
};

const testTopic = {
  name: 'Algebra',
  description: 'Basic algebra problems',
  subject_id: 1 // Will be set after subject creation
};

const testQuestions = [
  {
    question_text: 'What is 2 + 2?',
    option_a: '3',
    option_b: '4',
    option_c: '5',
    option_d: '6',
    correct_answer: 'B' as const,
    explanation: 'Basic addition: 2 + 2 = 4',
    difficulty_level: 'easy' as const,
    subject_id: 1,
    topic_id: 1
  },
  {
    question_text: 'What is 5 * 3?',
    option_a: '10',
    option_b: '12',
    option_c: '15',
    option_d: '18',
    correct_answer: 'C' as const,
    explanation: 'Basic multiplication: 5 * 3 = 15',
    difficulty_level: 'medium' as const,
    subject_id: 1,
    topic_id: 1
  }
];

const testQuiz = {
  title: 'Basic Math Quiz',
  description: 'A quiz covering basic mathematical operations'
};

describe('exportQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export quiz without answers', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values(testQuestions.map(q => ({ ...q, subject_id: subject.id, topic_id: topic.id })))
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values(testQuiz)
      .returning()
      .execute();

    // Add questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: questions[0].id, question_order: 1 },
        { quiz_id: quiz.id, question_id: questions[1].id, question_order: 2 }
      ])
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuiz(input);

    // Validate result structure
    expect(result.pdfData).toBeDefined();
    expect(typeof result.pdfData).toBe('string');
    expect(result.filename).toBeDefined();
    expect(result.filename).toMatch(/quiz-\d+-\d{4}-\d{2}-\d{2}\.pdf/);

    // Decode and check content
    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).toContain('Basic Math Quiz');
    expect(pdfContent).toContain('What is 2 + 2?');
    expect(pdfContent).toContain('What is 5 * 3?');
    expect(pdfContent).toContain('A) 3');
    expect(pdfContent).toContain('B) 4');
    expect(pdfContent).toContain('C) 15');
    expect(pdfContent).toContain('D) 18');
    
    // Should not contain answers when include_answers is false
    expect(pdfContent).not.toContain('Correct Answer: B');
    expect(pdfContent).not.toContain('Basic addition: 2 + 2 = 4');
    expect(pdfContent).not.toContain('ANSWER KEY');
  });

  it('should export quiz with answers', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values(testQuestions.map(q => ({ ...q, subject_id: subject.id, topic_id: topic.id })))
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values(testQuiz)
      .returning()
      .execute();

    // Add questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: questions[0].id, question_order: 1 },
        { quiz_id: quiz.id, question_id: questions[1].id, question_order: 2 }
      ])
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: true
    };

    const result = await exportQuiz(input);

    // Decode and check content includes answers
    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).toContain('Basic Math Quiz');
    expect(pdfContent).toContain('What is 2 + 2?');
    expect(pdfContent).toContain('Correct Answer: B');
    expect(pdfContent).toContain('Correct Answer: C');
    expect(pdfContent).toContain('Basic addition: 2 + 2 = 4');
    expect(pdfContent).toContain('Basic multiplication: 5 * 3 = 15');
    expect(pdfContent).toContain('ANSWER KEY');
    expect(pdfContent).toContain('1. B');
    expect(pdfContent).toContain('2. C');
  });

  it('should export quiz with proper question ordering', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values(testQuestions.map(q => ({ ...q, subject_id: subject.id, topic_id: topic.id })))
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values(testQuiz)
      .returning()
      .execute();

    // Add questions to quiz in reverse order
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: questions[1].id, question_order: 1 },
        { quiz_id: quiz.id, question_id: questions[0].id, question_order: 2 }
      ])
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuiz(input);

    // Decode and check question ordering
    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    
    // Question 1 should be "What is 5 * 3?" (order 1)
    const question1Index = pdfContent.indexOf('Question 1');
    const question2Index = pdfContent.indexOf('Question 2');
    const multiplication = pdfContent.indexOf('What is 5 * 3?');
    const addition = pdfContent.indexOf('What is 2 + 2?');
    
    expect(question1Index).toBeLessThan(question2Index);
    expect(multiplication).toBeGreaterThan(question1Index);
    expect(multiplication).toBeLessThan(question2Index);
    expect(addition).toBeGreaterThan(question2Index);
  });

  it('should include difficulty levels in export', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const questions = await db.insert(questionsTable)
      .values(testQuestions.map(q => ({ ...q, subject_id: subject.id, topic_id: topic.id })))
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values(testQuiz)
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: questions[0].id, question_order: 1 },
        { quiz_id: quiz.id, question_id: questions[1].id, question_order: 2 }
      ])
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuiz(input);

    // Check difficulty levels are included
    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).toContain('(EASY)');
    expect(pdfContent).toContain('(MEDIUM)');
  });

  it('should handle quiz with no description', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values([{ ...testQuestions[0], subject_id: subject.id, topic_id: topic.id }])
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Quiz Without Description', description: null })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values([{ quiz_id: quiz.id, question_id: question.id, question_order: 1 }])
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuiz(input);

    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).toContain('Quiz Without Description');
    expect(pdfContent).not.toContain('Description:');
  });

  it('should throw error for non-existent quiz', async () => {
    const input: ExportQuizInput = {
      quiz_id: 999,
      include_answers: false
    };

    await expect(exportQuiz(input)).rejects.toThrow(/quiz not found/i);
  });

  it('should handle quiz with no questions', async () => {
    // Create quiz without questions
    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Empty Quiz', description: 'Quiz with no questions' })
      .returning()
      .execute();

    const input: ExportQuizInput = {
      quiz_id: quiz.id,
      include_answers: false
    };

    const result = await exportQuiz(input);

    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).toContain('Empty Quiz');
    expect(pdfContent).toContain('Total Questions: 0');
    expect(result.filename).toMatch(/quiz-\d+-\d{4}-\d{2}-\d{2}\.pdf/);
  });

  it('should use default include_answers value when omitted', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ ...testTopic, subject_id: subject.id })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values([{ ...testQuestions[0], subject_id: subject.id, topic_id: topic.id }])
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values(testQuiz)
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values([{ quiz_id: quiz.id, question_id: question.id, question_order: 1 }])
      .execute();

    // Test omitting include_answers field entirely (should default to false)
    const input = { quiz_id: quiz.id } as ExportQuizInput;

    const result = await exportQuiz(input);

    const pdfContent = Buffer.from(result.pdfData, 'base64').toString('utf-8');
    expect(pdfContent).not.toContain('Correct Answer:');
    expect(pdfContent).not.toContain('ANSWER KEY');
  });
});
