import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq, and } from 'drizzle-orm';

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject'
      })
      .returning()
      .execute();
    const subject = subjectResult[0];

    // Create topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic algebra',
        subject_id: subject.id
      })
      .returning()
      .execute();
    const topic = topicResult[0];

    // Create questions
    const questions = [];
    for (let i = 1; i <= 5; i++) {
      const questionResult = await db.insert(questionsTable)
        .values({
          question_text: `Question ${i}?`,
          answer_text: `Answer ${i}`,
          subject_id: subject.id,
          topic_id: topic.id
        })
        .returning()
        .execute();
      questions.push(questionResult[0]);
    }

    return { subject, topic, questions };
  };

  const testInput: GenerateQuizInput = {
    title: 'Test Quiz',
    subject_id: 1,
    topic_id: 1,
    question_count: 3
  };

  it('should generate a quiz with selected questions', async () => {
    const { subject, topic } = await createTestData();
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id
    };

    const result = await generateQuiz(input);

    expect(result.title).toEqual('Test Quiz');
    expect(result.subject_id).toEqual(subject.id);
    expect(result.topic_id).toEqual(topic.id);
    expect(result.question_count).toEqual(3);
    expect(result.questions).toHaveLength(3);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify all questions belong to the correct subject and topic
    result.questions.forEach(question => {
      expect(question.subject_id).toEqual(subject.id);
      expect(question.topic_id).toEqual(topic.id);
      expect(question.question_text).toMatch(/^Question \d\?$/);
      expect(question.answer_text).toMatch(/^Answer \d$/);
    });
  });

  it('should save quiz to database', async () => {
    const { subject, topic } = await createTestData();
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id
    };

    const result = await generateQuiz(input);

    // Verify quiz was saved
    const savedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(savedQuiz).toHaveLength(1);
    expect(savedQuiz[0].title).toEqual('Test Quiz');
    expect(savedQuiz[0].subject_id).toEqual(subject.id);
    expect(savedQuiz[0].topic_id).toEqual(topic.id);
    expect(savedQuiz[0].question_count).toEqual(3);
  });

  it('should create quiz-question associations with correct order', async () => {
    const { subject, topic } = await createTestData();
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id
    };

    const result = await generateQuiz(input);

    // Verify quiz-question associations
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(3);

    // Check that order indices are correct (1, 2, 3)
    const orderIndices = quizQuestions.map(qq => qq.order_index).sort();
    expect(orderIndices).toEqual([1, 2, 3]);

    // Verify all question IDs are from our result
    const resultQuestionIds = result.questions.map(q => q.id);
    quizQuestions.forEach(qq => {
      expect(resultQuestionIds).toContain(qq.question_id);
    });
  });

  it('should select different questions on multiple calls', async () => {
    const { subject, topic } = await createTestData();
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id
    };

    // Generate multiple quizzes
    const quiz1 = await generateQuiz(input);
    const quiz2 = await generateQuiz(input);

    // Both should have 3 questions
    expect(quiz1.questions).toHaveLength(3);
    expect(quiz2.questions).toHaveLength(3);

    // With 5 available questions and selecting 3, there's a high probability
    // they will be different (not guaranteed due to randomness, but very likely)
    const quiz1QuestionIds = quiz1.questions.map(q => q.id).sort();
    const quiz2QuestionIds = quiz2.questions.map(q => q.id).sort();
    
    // At least one should be different (very high probability)
    expect(JSON.stringify(quiz1QuestionIds)).not.toEqual(JSON.stringify(quiz2QuestionIds));
  });

  it('should throw error when subject and topic combination is invalid', async () => {
    await createTestData();
    
    const input = {
      ...testInput,
      subject_id: 999, // Non-existent subject
      topic_id: 1
    };

    await expect(generateQuiz(input)).rejects.toThrow(/invalid subject and topic combination/i);
  });

  it('should throw error when topic does not belong to subject', async () => {
    const { subject } = await createTestData();
    
    // Create another subject and topic
    const subject2Result = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();
    const subject2 = subject2Result[0];

    const topic2Result = await db.insert(topicsTable)
      .values({
        name: 'Physics',
        description: 'Basic physics',
        subject_id: subject2.id
      })
      .returning()
      .execute();
    const topic2 = topic2Result[0];

    const input = {
      ...testInput,
      subject_id: subject.id, // Math subject
      topic_id: topic2.id     // Physics topic (belongs to Science subject)
    };

    await expect(generateQuiz(input)).rejects.toThrow(/invalid subject and topic combination/i);
  });

  it('should throw error when no questions are available', async () => {
    // Create subject and topic but no questions
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Empty Subject',
        description: 'Subject with no questions'
      })
      .returning()
      .execute();
    const subject = subjectResult[0];

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Empty Topic',
        description: 'Topic with no questions',
        subject_id: subject.id
      })
      .returning()
      .execute();
    const topic = topicResult[0];

    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id
    };

    await expect(generateQuiz(input)).rejects.toThrow(/no questions available/i);
  });

  it('should throw error when requesting more questions than available', async () => {
    const { subject, topic } = await createTestData(); // Creates 5 questions
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id,
      question_count: 10 // More than the 5 available
    };

    await expect(generateQuiz(input)).rejects.toThrow(/only 5 questions available, but 10 requested/i);
  });

  it('should handle requesting all available questions', async () => {
    const { subject, topic, questions } = await createTestData(); // Creates 5 questions
    
    const input = {
      ...testInput,
      subject_id: subject.id,
      topic_id: topic.id,
      question_count: 5 // All available questions
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(5);
    expect(result.question_count).toEqual(5);

    // Verify all original questions are included
    const resultQuestionIds = result.questions.map(q => q.id).sort();
    const originalQuestionIds = questions.map(q => q.id).sort();
    expect(resultQuestionIds).toEqual(originalQuestionIds);
  });
});
