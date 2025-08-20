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
import { getQuizById } from '../handlers/get_quiz_by_id';

describe('getQuizById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent quiz', async () => {
    const result = await getQuizById(999);
    expect(result).toBeNull();
  });

  it('should return quiz with empty questions array when quiz has no questions', async () => {
    // Create a quiz without questions
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'A quiz with no questions'
      })
      .returning()
      .execute();

    const result = await getQuizById(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(quiz.id);
    expect(result!.title).toBe('Empty Quiz');
    expect(result!.description).toBe('A quiz with no questions');
    expect(result!.questions).toEqual([]);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return quiz with questions in correct order', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ 
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic algebra',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create questions
    const [question1] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 2 + 2?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'multiple-choice',
        answer: '4'
      })
      .returning()
      .execute();

    const [question2] = await db.insert(questionsTable)
      .values({
        question_text: 'What is 3 + 3?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'short-answer',
        answer: '6'
      })
      .returning()
      .execute();

    const [question3] = await db.insert(questionsTable)
      .values({
        question_text: 'Is 5 > 3?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'true-false',
        answer: 'true'
      })
      .returning()
      .execute();

    // Create quiz
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Math Quiz',
        description: 'Basic math questions'
      })
      .returning()
      .execute();

    // Add questions to quiz in specific order (not insertion order)
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz.id, question_id: question2.id, order_index: 1 }, // Second question first
        { quiz_id: quiz.id, question_id: question3.id, order_index: 2 }, // Third question second
        { quiz_id: quiz.id, question_id: question1.id, order_index: 3 }  // First question last
      ])
      .execute();

    const result = await getQuizById(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(quiz.id);
    expect(result!.title).toBe('Math Quiz');
    expect(result!.description).toBe('Basic math questions');
    expect(result!.questions).toHaveLength(3);
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify questions are in correct order based on order_index
    expect(result!.questions[0].id).toBe(question2.id);
    expect(result!.questions[0].question_text).toBe('What is 3 + 3?');
    expect(result!.questions[0].type).toBe('short-answer');
    expect(result!.questions[0].answer).toBe('6');
    expect(result!.questions[0].subject_id).toBe(subject.id);
    expect(result!.questions[0].topic_id).toBe(topic.id);
    expect(result!.questions[0].created_at).toBeInstanceOf(Date);
    expect(result!.questions[0].updated_at).toBeInstanceOf(Date);

    expect(result!.questions[1].id).toBe(question3.id);
    expect(result!.questions[1].question_text).toBe('Is 5 > 3?');
    expect(result!.questions[1].type).toBe('true-false');

    expect(result!.questions[2].id).toBe(question1.id);
    expect(result!.questions[2].question_text).toBe('What is 2 + 2?');
    expect(result!.questions[2].type).toBe('multiple-choice');
  });

  it('should handle quiz with different question types', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ 
        name: 'Science',
        description: 'General science'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Biology',
        description: 'Life science',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create questions of different types
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Choose the correct answer',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'multiple-choice',
          answer: 'A'
        },
        {
          question_text: 'Explain photosynthesis',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'open-ended',
          answer: 'Process by which plants make food using sunlight'
        },
        {
          question_text: 'Plants need water',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'true-false',
          answer: 'true'
        },
        {
          question_text: 'Name one organelle',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'short-answer',
          answer: 'nucleus'
        }
      ])
      .returning()
      .execute();

    // Create quiz
    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Science Quiz',
        description: null // Test null description
      })
      .returning()
      .execute();

    // Add all questions to quiz
    await db.insert(quizQuestionsTable)
      .values(questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_id: q.id,
        order_index: index + 1
      })))
      .execute();

    const result = await getQuizById(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(quiz.id);
    expect(result!.title).toBe('Science Quiz');
    expect(result!.description).toBeNull();
    expect(result!.questions).toHaveLength(4);

    // Verify all question types are present
    const questionTypes = result!.questions.map(q => q.type);
    expect(questionTypes).toContain('multiple-choice');
    expect(questionTypes).toContain('open-ended');
    expect(questionTypes).toContain('true-false');
    expect(questionTypes).toContain('short-answer');

    // Verify each question has all required fields
    result!.questions.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.question_text).toBeDefined();
      expect(question.subject_id).toBe(subject.id);
      expect(question.topic_id).toBe(topic.id);
      expect(question.type).toBeDefined();
      expect(question.answer).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
      expect(question.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle foreign key constraints properly', async () => {
    // Create prerequisite data first
    const [subject] = await db.insert(subjectsTable)
      .values({ 
        name: 'Test Subject',
        description: 'For testing'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'For testing',
        subject_id: subject.id
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        question_text: 'Test question?',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'multiple-choice',
        answer: 'test answer'
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'Testing foreign keys'
      })
      .returning()
      .execute();

    // Add question to quiz
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question_id: question.id,
        order_index: 1
      })
      .execute();

    const result = await getQuizById(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(1);
    expect(result!.questions[0].subject_id).toBe(subject.id);
    expect(result!.questions[0].topic_id).toBe(topic.id);
  });

  it('should handle multiple quizzes correctly', async () => {
    // Create prerequisite data
    const [subject] = await db.insert(subjectsTable)
      .values({ 
        name: 'History',
        description: 'World history'
      })
      .returning()
      .execute();

    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Ancient Rome',
        description: 'Roman civilization',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          question_text: 'Who was Julius Caesar?',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'short-answer',
          answer: 'Roman general and politician'
        },
        {
          question_text: 'When did Rome fall?',
          subject_id: subject.id,
          topic_id: topic.id,
          type: 'short-answer',
          answer: '476 AD'
        }
      ])
      .returning()
      .execute();

    // Create two quizzes
    const [quiz1] = await db.insert(quizzesTable)
      .values({
        title: 'Rome Quiz 1',
        description: 'First quiz about Rome'
      })
      .returning()
      .execute();

    const [quiz2] = await db.insert(quizzesTable)
      .values({
        title: 'Rome Quiz 2',
        description: 'Second quiz about Rome'
      })
      .returning()
      .execute();

    // Add different questions to each quiz
    await db.insert(quizQuestionsTable)
      .values([
        { quiz_id: quiz1.id, question_id: questions[0].id, order_index: 1 },
        { quiz_id: quiz2.id, question_id: questions[1].id, order_index: 1 }
      ])
      .execute();

    // Test first quiz
    const result1 = await getQuizById(quiz1.id);
    expect(result1).not.toBeNull();
    expect(result1!.title).toBe('Rome Quiz 1');
    expect(result1!.questions).toHaveLength(1);
    expect(result1!.questions[0].question_text).toBe('Who was Julius Caesar?');

    // Test second quiz
    const result2 = await getQuizById(quiz2.id);
    expect(result2).not.toBeNull();
    expect(result2!.title).toBe('Rome Quiz 2');
    expect(result2!.questions).toHaveLength(1);
    expect(result2!.questions[0].question_text).toBe('When did Rome fall?');
  });
});
