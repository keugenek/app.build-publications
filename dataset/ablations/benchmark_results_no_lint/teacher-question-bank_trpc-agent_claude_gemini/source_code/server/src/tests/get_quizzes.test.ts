import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { getQuizzes, getQuizWithQuestions } from '../handlers/get_quizzes';

describe('getQuizzes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no quizzes exist', async () => {
    const result = await getQuizzes();
    expect(result).toEqual([]);
  });

  it('should return all quizzes', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic algebra',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Create test quizzes
    await db.insert(quizzesTable)
      .values([
        {
          title: 'Quiz 1',
          subject_id: subjectId,
          topic_id: topicId,
          question_count: 5
        },
        {
          title: 'Quiz 2',
          subject_id: subjectId,
          topic_id: topicId,
          question_count: 3
        }
      ])
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Quiz 1');
    expect(result[0].question_count).toEqual(5);
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].topic_id).toEqual(topicId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Quiz 2');
    expect(result[1].question_count).toEqual(3);
  });

  it('should return quizzes in creation order', async () => {
    // Create test subject and topic
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
        description: 'Basic physics',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    // Create quizzes with delay to ensure different timestamps
    await db.insert(quizzesTable)
      .values({
        title: 'First Quiz',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        question_count: 1
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(quizzesTable)
      .values({
        title: 'Second Quiz',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        question_count: 2
      })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('First Quiz');
    expect(result[1].title).toEqual('Second Quiz');
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
  });
});

describe('getQuizWithQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent quiz', async () => {
    const result = await getQuizWithQuestions(999);
    expect(result).toBeNull();
  });

  it('should return quiz with empty questions array when no questions assigned', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'History',
        description: 'History subject'
      })
      .returning()
      .execute();

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Ancient History',
        description: 'Ancient civilizations',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    // Create quiz without questions
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        question_count: 0
      })
      .returning()
      .execute();

    const result = await getQuizWithQuestions(quizResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Empty Quiz');
    expect(result!.question_count).toEqual(0);
    expect(result!.questions).toEqual([]);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return quiz with questions in correct order', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Biology',
        description: 'Biology subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Cell Biology',
        description: 'Study of cells',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Create test questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is a cell?',
          answer_text: 'The basic unit of life',
          subject_id: subjectId,
          topic_id: topicId
        },
        {
          question_text: 'What is DNA?',
          answer_text: 'Deoxyribonucleic acid',
          subject_id: subjectId,
          topic_id: topicId
        },
        {
          question_text: 'What is ATP?',
          answer_text: 'Adenosine triphosphate',
          subject_id: subjectId,
          topic_id: topicId
        }
      ])
      .returning()
      .execute();

    // Create quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Cell Biology Quiz',
        subject_id: subjectId,
        topic_id: topicId,
        question_count: 3
      })
      .returning()
      .execute();

    const quizId = quizResult[0].id;

    // Add questions to quiz in specific order (reverse order to test ordering)
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quizId,
          question_id: questionsResult[2].id, // ATP question - order 0
          order_index: 0
        },
        {
          quiz_id: quizId,
          question_id: questionsResult[0].id, // Cell question - order 1
          order_index: 1
        },
        {
          quiz_id: quizId,
          question_id: questionsResult[1].id, // DNA question - order 2
          order_index: 2
        }
      ])
      .execute();

    const result = await getQuizWithQuestions(quizId);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Cell Biology Quiz');
    expect(result!.question_count).toEqual(3);
    expect(result!.questions).toHaveLength(3);

    // Verify questions are in correct order (ATP, Cell, DNA)
    expect(result!.questions[0].question_text).toEqual('What is ATP?');
    expect(result!.questions[0].answer_text).toEqual('Adenosine triphosphate');
    expect(result!.questions[1].question_text).toEqual('What is a cell?');
    expect(result!.questions[1].answer_text).toEqual('The basic unit of life');
    expect(result!.questions[2].question_text).toEqual('What is DNA?');
    expect(result!.questions[2].answer_text).toEqual('Deoxyribonucleic acid');

    // Verify all questions have correct fields
    result!.questions.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.subject_id).toEqual(subjectId);
      expect(question.topic_id).toEqual(topicId);
      expect(question.created_at).toBeInstanceOf(Date);
      expect(typeof question.question_text).toBe('string');
      expect(typeof question.answer_text).toBe('string');
    });
  });

  it('should handle quiz with single question', async () => {
    // Create test data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Chemistry',
        description: 'Chemistry subject'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Organic Chemistry',
        description: 'Study of organic compounds',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is methane?',
        answer_text: 'CH4',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Single Question Quiz',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id,
        question_count: 1
      })
      .returning()
      .execute();

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizResult[0].id,
        question_id: questionResult[0].id,
        order_index: 0
      })
      .execute();

    const result = await getQuizWithQuestions(quizResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(1);
    expect(result!.questions[0].question_text).toEqual('What is methane?');
    expect(result!.questions[0].answer_text).toEqual('CH4');
  });
});
