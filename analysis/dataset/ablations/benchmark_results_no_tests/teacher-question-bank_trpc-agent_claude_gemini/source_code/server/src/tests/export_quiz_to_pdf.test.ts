import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  subjectsTable, 
  topicsTable, 
  questionsTable, 
  quizzesTable, 
  quizQuestionsTable,
  multipleChoiceOptionsTable
} from '../db/schema';
import { type ExportQuizToPdfInput } from '../schema';
import { exportQuizToPdf } from '../handlers/export_quiz_to_pdf';

describe('exportQuizToPdf', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export quiz to PDF without answers', async () => {
    // Create test subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Basic math concepts'
      })
      .returning()
      .execute();

    // Create test topic
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic algebra',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Create test questions
    const question1 = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    const question2 = await db.insert(questionsTable)
      .values({
        question_text: 'Solve for x: x + 5 = 10',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'short-answer',
        answer: '5'
      })
      .returning()
      .execute();

    // Create multiple choice options for question 1
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: question1[0].id,
          option_text: '3',
          is_correct: false
        },
        {
          question_id: question1[0].id,
          option_text: '4',
          is_correct: true
        },
        {
          question_id: question1[0].id,
          option_text: '5',
          is_correct: false
        }
      ])
      .execute();

    // Create test quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Math Test',
        description: 'Basic math quiz'
      })
      .returning()
      .execute();

    // Add questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz[0].id,
          question_id: question1[0].id,
          order_index: 1
        },
        {
          quiz_id: quiz[0].id,
          question_id: question2[0].id,
          order_index: 2
        }
      ])
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: false
    };

    const result = await exportQuizToPdf(input);

    // Verify PDF URL is generated
    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfUrl).toMatch(/^\/exports\/quiz-\d+-.*\.pdf$/);
    expect(result.pdfUrl).toContain(`quiz-${quiz[0].id}`);
  });

  it('should export quiz to PDF with answers included', async () => {
    // Create test data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'General science'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Physics',
        description: 'Basic physics',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is the speed of light?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'open-ended',
        answer: '299,792,458 m/s'
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Physics Quiz',
        description: null
      })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz[0].id,
        question_id: question[0].id,
        order_index: 1
      })
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfUrl).toMatch(/^\/exports\/quiz-\d+-.*\.pdf$/);
  });

  it('should handle quiz with no description', async () => {
    // Create minimal test data
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'History',
        description: null
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'World War II',
        description: null,
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'When did WWII end?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'true-false',
        answer: 'true'
      })
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'WWII Quiz'
        // description is null/undefined
      })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz[0].id,
        question_id: question[0].id,
        order_index: 1
      })
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: false
    };

    const result = await exportQuizToPdf(input);

    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfUrl).toContain(`quiz-${quiz[0].id}`);
  });

  it('should handle multiple choice questions with multiple options', async () => {
    // Create test data with extensive multiple choice options
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Geography',
        description: 'World geography'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'Capitals',
        description: 'World capitals',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        subject_id: subject[0].id,
        topic_id: topic[0].id,
        type: 'multiple-choice',
        answer: 'Paris'
      })
      .returning()
      .execute();

    // Create multiple options
    await db.insert(multipleChoiceOptionsTable)
      .values([
        {
          question_id: question[0].id,
          option_text: 'London',
          is_correct: false
        },
        {
          question_id: question[0].id,
          option_text: 'Berlin',
          is_correct: false
        },
        {
          question_id: question[0].id,
          option_text: 'Paris',
          is_correct: true
        },
        {
          question_id: question[0].id,
          option_text: 'Madrid',
          is_correct: false
        }
      ])
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Geography Test',
        description: 'Test your geography knowledge'
      })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz[0].id,
        question_id: question[0].id,
        order_index: 1
      })
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfUrl).toMatch(/\.pdf$/);
  });

  it('should throw error for non-existent quiz', async () => {
    const input: ExportQuizToPdfInput = {
      quiz_id: 99999,
      include_answers: false
    };

    await expect(exportQuizToPdf(input)).rejects.toThrow(/Quiz with ID 99999 not found/i);
  });

  it('should throw error for quiz with no questions', async () => {
    // Create quiz without questions
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'This quiz has no questions'
      })
      .returning()
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: false
    };

    await expect(exportQuizToPdf(input)).rejects.toThrow(/No questions found for quiz ID/i);
  });

  it('should handle questions with different types correctly', async () => {
    // Create comprehensive test with all question types
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Mixed Topics',
        description: 'Various subjects'
      })
      .returning()
      .execute();

    const topic = await db.insert(topicsTable)
      .values({
        name: 'General Knowledge',
        description: 'Mixed topics',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Create questions of different types
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Multiple choice question',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'multiple-choice',
          answer: 'A'
        },
        {
          question_text: 'True or false question',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'true-false',
          answer: 'true'
        },
        {
          question_text: 'Short answer question',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'short-answer',
          answer: 'Short answer'
        },
        {
          question_text: 'Open ended question',
          subject_id: subject[0].id,
          topic_id: topic[0].id,
          type: 'open-ended',
          answer: 'Long detailed answer'
        }
      ])
      .returning()
      .execute();

    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Mixed Question Types Quiz',
        description: 'Quiz with all question types'
      })
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values(
        questions.map((q, index) => ({
          quiz_id: quiz[0].id,
          question_id: q.id,
          order_index: index + 1
        }))
      )
      .execute();

    const input: ExportQuizToPdfInput = {
      quiz_id: quiz[0].id,
      include_answers: true
    };

    const result = await exportQuizToPdf(input);

    expect(result.pdfUrl).toBeDefined();
    expect(result.pdfUrl).toContain(`quiz-${quiz[0].id}`);
    expect(result.pdfUrl).toMatch(/^\/exports\/.*\.pdf$/);
  });
});
