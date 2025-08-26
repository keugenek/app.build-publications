import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getQuizWithQuestions } from '../handlers/get_quiz_with_questions';

describe('getQuizWithQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return quiz with questions', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ 
        name: 'Algebra',
        subject_id: subject.id
      })
      .returning()
      .execute();

    const [question1] = await db.insert(questionsTable)
      .values({
        text: 'What is 2 + 2?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    const [question2] = await db.insert(questionsTable)
      .values({
        text: 'What is 3 + 3?',
        subject_id: subject.id,
        topic_id: topic.id
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Basic Math Quiz' })
      .returning()
      .execute();

    // Associate questions with quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: question1.id },
        { quiz_id: quiz.id, question_id: question2.id }
      ])
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await getQuizWithQuestions(input);

    // Verify quiz data
    expect(result).toBeDefined();
    expect(result!.id).toEqual(quiz.id);
    expect(result!.title).toEqual('Basic Math Quiz');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify questions
    expect(result!.questions).toHaveLength(2);
    expect(result!.questions[0].text).toEqual('What is 2 + 2?');
    expect(result!.questions[1].text).toEqual('What is 3 + 3?');
    
    // Verify question structure
    result!.questions.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.text).toBeDefined();
      expect(question.subject_id).toEqual(subject.id);
      expect(question.topic_id).toEqual(topic.id);
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return quiz with empty questions array when quiz has no questions', async () => {
    // Create quiz without questions
    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Empty Quiz' })
      .returning()
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await getQuizWithQuestions(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(quiz.id);
    expect(result!.title).toEqual('Empty Quiz');
    expect(result!.questions).toHaveLength(0);
  });

  it('should return null when quiz does not exist', async () => {
    const input: GetByIdInput = { id: 999 };
    const result = await getQuizWithQuestions(input);

    expect(result).toBeNull();
  });

  it('should return questions in consistent order', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({ 
        name: 'Physics',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create multiple questions
    const questions = await db.insert(questionsTable)
      .values([
        { text: 'Question A', subject_id: subject.id, topic_id: topic.id },
        { text: 'Question B', subject_id: subject.id, topic_id: topic.id },
        { text: 'Question C', subject_id: subject.id, topic_id: topic.id }
      ])
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({ title: 'Physics Quiz' })
      .returning()
      .execute();

    // Associate questions with quiz
    await db.insert(quizQuestionsTable)
      .values(questions.map(q => ({ quiz_id: quiz.id, question_id: q.id })))
      .execute();

    const input: GetByIdInput = { id: quiz.id };
    const result = await getQuizWithQuestions(input);

    expect(result).toBeDefined();
    expect(result!.questions).toHaveLength(3);
    
    // Verify all questions are returned
    const questionTexts = result!.questions.map(q => q.text).sort();
    expect(questionTexts).toEqual(['Question A', 'Question B', 'Question C']);
  });
});
