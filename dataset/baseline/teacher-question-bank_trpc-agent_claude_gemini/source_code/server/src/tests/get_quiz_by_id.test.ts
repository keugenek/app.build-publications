import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getQuizById } from '../handlers/get_quiz_by_id';

describe('getQuizById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get quiz with all questions ordered by question_order', async () => {
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Algebra topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Math Quiz',
        description: 'A comprehensive math quiz'
      })
      .returning()
      .execute();

    // Create multiple questions
    const questionsData = [
      {
        question_text: 'What is 2 + 2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B' as const,
        explanation: 'Simple addition',
        difficulty_level: 'easy' as const,
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      },
      {
        question_text: 'What is 5 × 3?',
        option_a: '15',
        option_b: '12',
        option_c: '18',
        option_d: '20',
        correct_answer: 'A' as const,
        explanation: 'Simple multiplication',
        difficulty_level: 'medium' as const,
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      },
      {
        question_text: 'What is the square root of 16?',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '8',
        correct_answer: 'C' as const,
        explanation: 'Square root calculation',
        difficulty_level: 'hard' as const,
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      }
    ];

    const createdQuestions = await db.insert(questionsTable)
      .values(questionsData)
      .returning()
      .execute();

    // Add questions to quiz in specific order (reverse order to test ordering)
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quizResult[0].id, question_id: createdQuestions[2].id, question_order: 1 },
        { quiz_id: quizResult[0].id, question_id: createdQuestions[0].id, question_order: 2 },
        { quiz_id: quizResult[0].id, question_id: createdQuestions[1].id, question_order: 3 }
      ])
      .execute();

    const input: GetByIdInput = { id: quizResult[0].id };
    const result = await getQuizById(input);

    // Verify quiz data
    expect(result.id).toEqual(quizResult[0].id);
    expect(result.title).toEqual('Math Quiz');
    expect(result.description).toEqual('A comprehensive math quiz');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify questions are returned in correct order
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].question_text).toEqual('What is the square root of 16?');
    expect(result.questions[1].question_text).toEqual('What is 2 + 2?');
    expect(result.questions[2].question_text).toEqual('What is 5 × 3?');

    // Verify all question fields are present and correct
    const firstQuestion = result.questions[0];
    expect(firstQuestion.id).toEqual(createdQuestions[2].id);
    expect(firstQuestion.option_a).toEqual('2');
    expect(firstQuestion.option_b).toEqual('3');
    expect(firstQuestion.option_c).toEqual('4');
    expect(firstQuestion.option_d).toEqual('8');
    expect(firstQuestion.correct_answer).toEqual('C');
    expect(firstQuestion.explanation).toEqual('Square root calculation');
    expect(firstQuestion.difficulty_level).toEqual('hard');
    expect(firstQuestion.subject_id).toEqual(subjectResult[0].id);
    expect(firstQuestion.topic_id).toEqual(topicResult[0].id);
    expect(firstQuestion.created_at).toBeInstanceOf(Date);
    expect(firstQuestion.updated_at).toBeInstanceOf(Date);
  });

  it('should return quiz with empty questions array when quiz has no questions', async () => {
    // Create quiz without questions
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'Quiz with no questions'
      })
      .returning()
      .execute();

    const input: GetByIdInput = { id: quizResult[0].id };
    const result = await getQuizById(input);

    expect(result.id).toEqual(quizResult[0].id);
    expect(result.title).toEqual('Empty Quiz');
    expect(result.description).toEqual('Quiz with no questions');
    expect(result.questions).toHaveLength(0);
  });

  it('should handle quiz with null description', async () => {
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Quiz Without Description',
        description: null
      })
      .returning()
      .execute();

    const input: GetByIdInput = { id: quizResult[0].id };
    const result = await getQuizById(input);

    expect(result.id).toEqual(quizResult[0].id);
    expect(result.title).toEqual('Quiz Without Description');
    expect(result.description).toBeNull();
    expect(result.questions).toHaveLength(0);
  });

  it('should throw error when quiz does not exist', async () => {
    const input: GetByIdInput = { id: 999 };
    
    await expect(getQuizById(input)).rejects.toThrow(/Quiz with id 999 not found/i);
  });

  it('should handle questions with null explanations', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Physics',
        description: 'Physics topic',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Science Quiz',
        description: 'Science quiz'
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is gravity?',
        option_a: 'A force',
        option_b: 'A theory',
        option_c: 'A law',
        option_d: 'A concept',
        correct_answer: 'A',
        explanation: null, // Null explanation
        difficulty_level: 'medium',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizResult[0].id,
        question_id: questionResult[0].id,
        question_order: 1
      })
      .execute();

    const input: GetByIdInput = { id: quizResult[0].id };
    const result = await getQuizById(input);

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].explanation).toBeNull();
    expect(result.questions[0].question_text).toEqual('What is gravity?');
  });
});
