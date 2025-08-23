import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable, quizQuestionsTable, subjectsTable, topicsTable } from '../db/schema';
import { exportQuiz } from '../handlers/export_quiz';

describe('exportQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export a quiz with its questions in the correct format', async () => {
    // Create a subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    
    const subject = subjectResult[0];

    // Create a topic
    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Arithmetic', subject_id: subject.id })
      .returning()
      .execute();
      
    const topic = topicResult[0];

    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ name: 'Math Quiz' })
      .returning()
      .execute();
    
    const quiz = quizResult[0];

    // Create some questions
    const question1Result = await db.insert(questionsTable)
      .values({
        text: 'What is 2+2?',
        type: 'Open Ended',
        correct_answer: '4',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();
      
    const question2Result = await db.insert(questionsTable)
      .values({
        text: 'What is the capital of France?',
        type: 'Open Ended',
        correct_answer: 'Paris',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    const question1 = question1Result[0];
    const question2 = question2Result[0];

    // Link questions to the quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: question1.id, order: 1 },
        { quiz_id: quiz.id, question_id: question2.id, order: 2 }
      ])
      .execute();

    // Export the quiz
    const result = await exportQuiz(quiz.id);

    // Check the output format
    expect(result).toContain(`Quiz: ${quiz.name}`);
    expect(result).toContain('Question 1: What is 2+2?');
    expect(result).toContain('Answer: 4');
    expect(result).toContain('Question 2: What is the capital of France?');
    expect(result).toContain('Answer: Paris');
  });

  it('should handle a quiz with no questions', async () => {
    // Create a subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    
    const subject = subjectResult[0];

    // Create a topic
    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Arithmetic', subject_id: subject.id })
      .returning()
      .execute();
      
    const topic = topicResult[0];

    // Create a quiz with no questions
    const quizResult = await db.insert(quizzesTable)
      .values({ name: 'Empty Quiz' })
      .returning()
      .execute();
    
    const quiz = quizResult[0];

    // Export the quiz
    const result = await exportQuiz(quiz.id);

    // Check the output format
    expect(result).toContain(`Quiz: ${quiz.name}`);
    expect(result).toContain('No questions found in this quiz.');
  });

  it('should throw an error for a non-existent quiz', async () => {
    // Try to export a quiz that doesn't exist
    await expect(exportQuiz(99999))
      .rejects
      .toThrow(/Quiz with ID 99999 not found/);
  });
});
