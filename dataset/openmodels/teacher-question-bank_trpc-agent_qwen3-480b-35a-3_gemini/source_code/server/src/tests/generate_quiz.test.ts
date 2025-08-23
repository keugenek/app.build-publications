import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq } from 'drizzle-orm';

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a quiz with random questions', async () => {
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject.id })
      .returning();
    const topic = topicResult[0];

    // Create multiple questions
    const questionsData = [
      { text: 'What is 2+2?', answer: '4', subject_id: subject.id, topic_id: topic.id },
      { text: 'What is 3*3?', answer: '9', subject_id: subject.id, topic_id: topic.id },
      { text: 'What is 10/2?', answer: '5', subject_id: subject.id, topic_id: topic.id }
    ];

    for (const questionData of questionsData) {
      await db.insert(questionsTable)
        .values(questionData)
        .execute();
    }

    // Generate quiz input
    const input: GenerateQuizInput = {
      name: 'Math Quiz',
      count: 2
    };

    // Generate the quiz
    const result = await generateQuiz(input);

    // Validate quiz
    expect(result.quiz.name).toEqual('Math Quiz');
    expect(result.quiz.id).toBeDefined();
    expect(result.quiz.created_at).toBeInstanceOf(Date);

    // Validate questions
    expect(result.questions).toHaveLength(2);
    expect(result.questions.every(q => typeof q.id === 'number')).toBe(true);
    expect(result.questions.every(q => typeof q.text === 'string')).toBe(true);
    expect(result.questions.every(q => typeof q.answer === 'string')).toBe(true);
  });

  it('should generate a quiz with questions from a specific subject', async () => {
    // Create test data
    const subject1Result = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning();
    const subject1 = subject1Result[0];

    const subject2Result = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning();
    const subject2 = subject2Result[0];

    const topic1Result = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject1.id })
      .returning();
    const topic1 = topic1Result[0];

    const topic2Result = await db.insert(topicsTable)
      .values({ name: 'Biology', subject_id: subject2.id })
      .returning();
    const topic2 = topic2Result[0];

    // Create questions for each subject
    await db.insert(questionsTable)
      .values({ text: 'Math question 1', answer: 'Answer 1', subject_id: subject1.id, topic_id: topic1.id })
      .execute();

    await db.insert(questionsTable)
      .values({ text: 'Math question 2', answer: 'Answer 2', subject_id: subject1.id, topic_id: topic1.id })
      .execute();

    await db.insert(questionsTable)
      .values({ text: 'Science question 1', answer: 'Answer 3', subject_id: subject2.id, topic_id: topic2.id })
      .execute();

    // Generate quiz for Math subject only
    const input: GenerateQuizInput = {
      name: 'Math Quiz',
      subject_id: subject1.id,
      count: 2
    };

    const result = await generateQuiz(input);

    // Validate that all questions are from the Math subject
    expect(result.questions).toHaveLength(2);
    expect(result.questions.every(q => q.subject_id === subject1.id)).toBe(true);
  });

  it('should generate a quiz with questions from a specific topic', async () => {
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning();
    const subject = subjectResult[0];

    const topic1Result = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject.id })
      .returning();
    const topic1 = topic1Result[0];

    const topic2Result = await db.insert(topicsTable)
      .values({ name: 'Geometry', subject_id: subject.id })
      .returning();
    const topic2 = topic2Result[0];

    // Create questions for each topic
    await db.insert(questionsTable)
      .values({ text: 'Algebra question 1', answer: 'Answer 1', subject_id: subject.id, topic_id: topic1.id })
      .execute();

    await db.insert(questionsTable)
      .values({ text: 'Algebra question 2', answer: 'Answer 2', subject_id: subject.id, topic_id: topic1.id })
      .execute();

    await db.insert(questionsTable)
      .values({ text: 'Geometry question 1', answer: 'Answer 3', subject_id: subject.id, topic_id: topic2.id })
      .execute();

    // Generate quiz for Algebra topic only
    const input: GenerateQuizInput = {
      name: 'Algebra Quiz',
      topic_id: topic1.id,
      count: 2
    };

    const result = await generateQuiz(input);

    // Validate that all questions are from the Algebra topic
    expect(result.questions).toHaveLength(2);
    expect(result.questions.every(q => q.topic_id === topic1.id)).toBe(true);
  });

  it('should throw error when not enough questions are available', async () => {
    // Create test data with only one question
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject.id })
      .returning();
    const topic = topicResult[0];

    // Create only one question
    await db.insert(questionsTable)
      .values({ text: 'What is 2+2?', answer: '4', subject_id: subject.id, topic_id: topic.id })
      .execute();

    // Try to generate a quiz with 5 questions
    const input: GenerateQuizInput = {
      name: 'Math Quiz',
      count: 5
    };

    await expect(generateQuiz(input)).rejects.toThrow(/Not enough questions available/);
  });

  it('should save quiz and questions to database correctly', async () => {
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Math' })
      .returning();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({ name: 'Algebra', subject_id: subject.id })
      .returning();
    const topic = topicResult[0];

    // Create multiple questions
    const questionsData = [
      { text: 'Question 1', answer: 'Answer 1', subject_id: subject.id, topic_id: topic.id },
      { text: 'Question 2', answer: 'Answer 2', subject_id: subject.id, topic_id: topic.id },
      { text: 'Question 3', answer: 'Answer 3', subject_id: subject.id, topic_id: topic.id }
    ];

    for (const questionData of questionsData) {
      await db.insert(questionsTable)
        .values(questionData)
        .execute();
    }

    // Generate quiz
    const input: GenerateQuizInput = {
      name: 'Database Test Quiz',
      count: 2
    };

    const result = await generateQuiz(input);

    // Check if quiz was saved correctly
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.quiz.id))
      .execute();
    
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].name).toEqual('Database Test Quiz');

    // Check if quiz questions were saved correctly
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.quiz.id))
      .execute();

    expect(quizQuestions).toHaveLength(2);
  });
});
