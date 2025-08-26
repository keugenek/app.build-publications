import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { exportQuiz } from '../handlers/export_quiz';

describe('exportQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export a quiz with questions in printable format', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Test Topic', subject_id: subject.id })
      .returning()
      .execute();
    const topic = topicResult[0];

    // Create quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Sample Quiz' })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create questions
    const question1Result = await db.insert(questionsTable)
      .values({ 
        text: 'What is the capital of France?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();
    
    const question2Result = await db.insert(questionsTable)
      .values({
        text: 'What is 2 + 2?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    // Link questions to quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: question1Result[0].id },
        { quiz_id: quiz.id, question_id: question2Result[0].id }
      ])
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await exportQuiz(input);

    // Verify the exported format
    expect(result).toContain('Quiz: Sample Quiz');
    expect(result).toContain('Created:');
    expect(result).toContain('Questions:');
    expect(result).toContain('1. What is the capital of France?');
    expect(result).toContain('2. What is 2 + 2?');
    
    // Check the structure - should have title, date, and numbered questions
    const lines = result.split('\n');
    expect(lines[0]).toEqual('Quiz: Sample Quiz');
    expect(lines[1]).toMatch(/^Created: \d{1,2}\/\d{1,2}\/\d{4}$/); // Date format check
    expect(lines[2]).toEqual(''); // Empty line
    expect(lines[3]).toEqual('Questions:');
    expect(lines[4]).toEqual('1. What is the capital of France?');
    expect(lines[5]).toEqual('2. What is 2 + 2?');
  });

  it('should export quiz with no questions', async () => {
    // Create quiz without questions
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Empty Quiz' })
      .returning()
      .execute();
    const quiz = quizResult[0];

    const input: GetByIdInput = { id: quiz.id };
    const result = await exportQuiz(input);

    // Verify the exported format for empty quiz
    expect(result).toContain('Quiz: Empty Quiz');
    expect(result).toContain('Created:');
    expect(result).toContain('This quiz contains no questions.');
    expect(result).not.toContain('Questions:');
  });

  it('should handle quiz with single question', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Arithmetic', subject_id: subject.id })
      .returning()
      .execute();
    const topic = topicResult[0];

    // Create quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Single Question Quiz' })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create one question
    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'What is the square root of 16?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    // Link question to quiz
    await db.insert(quizQuestionsTable)
      .values({ quiz_id: quiz.id, question_id: questionResult[0].id })
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await exportQuiz(input);

    expect(result).toContain('Quiz: Single Question Quiz');
    expect(result).toContain('Questions:');
    expect(result).toContain('1. What is the square root of 16?');
    expect(result).not.toContain('2.'); // Should not have a second question
  });

  it('should handle quiz with long title and complex questions', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Computer Science' })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Programming', subject_id: subject.id })
      .returning()
      .execute();
    const topic = topicResult[0];

    // Create quiz with long title
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'Advanced Programming Concepts and Data Structures Final Examination' })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create question with complex text
    const questionResult = await db.insert(questionsTable)
      .values({
        text: 'Explain the difference between a binary search tree and a balanced binary search tree, including time complexity analysis for insertion, deletion, and search operations.',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    // Link question to quiz
    await db.insert(quizQuestionsTable)
      .values({ quiz_id: quiz.id, question_id: questionResult[0].id })
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await exportQuiz(input);

    expect(result).toContain('Quiz: Advanced Programming Concepts and Data Structures Final Examination');
    expect(result).toContain('1. Explain the difference between a binary search tree and a balanced binary search tree, including time complexity analysis for insertion, deletion, and search operations.');
  });

  it('should throw error for non-existent quiz', async () => {
    const input: GetByIdInput = { id: 999999 };

    await expect(exportQuiz(input)).rejects.toThrow(/Quiz with ID 999999 not found/i);
  });

  it('should preserve question order from database', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'History' })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'World Wars', subject_id: subject.id })
      .returning()
      .execute();
    const topic = topicResult[0];

    // Create quiz
    const quizResult = await db.insert(quizzesTable)
      .values({ title: 'History Quiz' })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create multiple questions
    const questions = [
      'When did World War I start?',
      'Who was the leader of Germany during World War II?',
      'What year did World War II end?'
    ];

    const questionResults = [];
    for (const questionText of questions) {
      const questionResult = await db.insert(questionsTable)
        .values({
          text: questionText,
          subject_id: subject.id,
          topic_id: topic.id
        })
        .returning()
        .execute();
      questionResults.push(questionResult[0]);
    }

    // Link questions to quiz in specific order
    for (const question of questionResults) {
      await db.insert(quizQuestionsTable)
        .values({ quiz_id: quiz.id, question_id: question.id })
        .execute();
    }

    const input: GetByIdInput = { id: quiz.id };
    const result = await exportQuiz(input);

    // Verify questions are numbered correctly
    expect(result).toContain('1. When did World War I start?');
    expect(result).toContain('2. Who was the leader of Germany during World War II?');
    expect(result).toContain('3. What year did World War II end?');
  });
});
