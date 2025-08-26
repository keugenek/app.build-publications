import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type GenerateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq, inArray } from 'drizzle-orm';

describe('generateQuiz', () => {
  let subjectId1: number;
  let subjectId2: number;
  let topicId1: number;
  let topicId2: number;
  let topicId3: number;

  beforeEach(async () => {
    await createDB();

    // Create test subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics', description: 'Math subject' },
        { name: 'Science', description: 'Science subject' }
      ])
      .returning()
      .execute();

    subjectId1 = subjects[0].id;
    subjectId2 = subjects[1].id;

    // Create test topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', description: 'Algebra topic', subject_id: subjectId1 },
        { name: 'Geometry', description: 'Geometry topic', subject_id: subjectId1 },
        { name: 'Physics', description: 'Physics topic', subject_id: subjectId2 }
      ])
      .returning()
      .execute();

    topicId1 = topics[0].id;
    topicId2 = topics[1].id;
    topicId3 = topics[2].id;

    // Create test questions
    await db.insert(questionsTable)
      .values([
        {
          question_text: 'What is 2 + 2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_answer: 'B',
          explanation: '2 + 2 equals 4',
          difficulty_level: 'easy',
          subject_id: subjectId1,
          topic_id: topicId1
        },
        {
          question_text: 'What is 5 * 3?',
          option_a: '15',
          option_b: '20',
          option_c: '25',
          option_d: '30',
          correct_answer: 'A',
          explanation: '5 * 3 equals 15',
          difficulty_level: 'medium',
          subject_id: subjectId1,
          topic_id: topicId1
        },
        {
          question_text: 'What is the area of a circle?',
          option_a: 'πr',
          option_b: '2πr',
          option_c: 'πr²',
          option_d: '2πr²',
          correct_answer: 'C',
          explanation: 'Area of circle is πr²',
          difficulty_level: 'hard',
          subject_id: subjectId1,
          topic_id: topicId2
        },
        {
          question_text: 'What is gravity?',
          option_a: 'Force',
          option_b: 'Energy',
          option_c: 'Mass',
          option_d: 'Weight',
          correct_answer: 'A',
          explanation: 'Gravity is a force',
          difficulty_level: 'easy',
          subject_id: subjectId2,
          topic_id: topicId3
        },
        {
          question_text: 'What is speed of light?',
          option_a: '3×10⁸ m/s',
          option_b: '2×10⁸ m/s',
          option_c: '4×10⁸ m/s',
          option_d: '5×10⁸ m/s',
          correct_answer: 'A',
          explanation: 'Speed of light is 3×10⁸ m/s',
          difficulty_level: 'medium',
          subject_id: subjectId2,
          topic_id: topicId3
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  const baseInput: GenerateQuizInput = {
    title: 'Test Quiz',
    description: 'A quiz for testing',
    subject_ids: [1], // Will be updated in tests
    question_count: 3,
    topic_ids: undefined,
    difficulty_levels: undefined
  };

  it('should create a quiz with specified questions', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1],
      question_count: 2
    };

    const result = await generateQuiz(input);

    // Verify quiz properties
    expect(result.title).toEqual('Test Quiz');
    expect(result.description).toEqual('A quiz for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.questions).toHaveLength(2);

    // Verify questions are from the correct subject
    result.questions.forEach(question => {
      expect(question.subject_id).toEqual(subjectId1);
      expect(question.question_text).toBeDefined();
      expect(question.correct_answer).toBeDefined();
    });
  });

  it('should save quiz to database with question associations', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1],
      question_count: 2
    };

    const result = await generateQuiz(input);

    // Verify quiz was saved
    const savedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(savedQuiz).toHaveLength(1);
    expect(savedQuiz[0].title).toEqual('Test Quiz');

    // Verify quiz-question associations were created
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(2);
    expect(quizQuestions[0].question_order).toEqual(1);
    expect(quizQuestions[1].question_order).toEqual(2);
  });

  it('should filter questions by topic IDs when provided', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1],
      topic_ids: [topicId1], // Only algebra questions
      question_count: 5
    };

    const result = await generateQuiz(input);

    expect(result.questions.length).toBeGreaterThan(0);
    result.questions.forEach(question => {
      expect(question.topic_id).toEqual(topicId1);
      expect(question.subject_id).toEqual(subjectId1);
    });
  });

  it('should filter questions by difficulty levels when provided', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1, subjectId2],
      difficulty_levels: ['easy'],
      question_count: 5
    };

    const result = await generateQuiz(input);

    expect(result.questions.length).toBeGreaterThan(0);
    result.questions.forEach(question => {
      expect(question.difficulty_level).toEqual('easy');
    });
  });

  it('should handle multiple subjects', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1, subjectId2],
      question_count: 4
    };

    const result = await generateQuiz(input);

    expect(result.questions).toHaveLength(4);
    
    // Verify questions come from specified subjects
    const subjectIds = result.questions.map(q => q.subject_id);
    subjectIds.forEach(id => {
      expect([subjectId1, subjectId2]).toContain(id);
    });
  });

  it('should limit questions to available count when requested count exceeds available', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1],
      topic_ids: [topicId1], // Only has 2 questions
      question_count: 10 // Requesting more than available
    };

    const result = await generateQuiz(input);

    // Should only return the 2 available questions
    expect(result.questions).toHaveLength(2);
    result.questions.forEach(question => {
      expect(question.topic_id).toEqual(topicId1);
    });
  });

  it('should apply combined filters correctly', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1],
      topic_ids: [topicId1],
      difficulty_levels: ['easy', 'medium'],
      question_count: 5
    };

    const result = await generateQuiz(input);

    expect(result.questions.length).toBeGreaterThan(0);
    result.questions.forEach(question => {
      expect(question.subject_id).toEqual(subjectId1);
      expect(question.topic_id).toEqual(topicId1);
      expect(['easy', 'medium']).toContain(question.difficulty_level);
    });
  });

  it('should throw error when no questions match criteria', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [999], // Non-existent subject
      question_count: 1
    };

    await expect(generateQuiz(input)).rejects.toThrow(/No questions found matching the specified criteria/i);
  });

  it('should handle quiz with null description', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      description: null,
      subject_ids: [subjectId1],
      question_count: 1
    };

    const result = await generateQuiz(input);

    expect(result.description).toBeNull();
    expect(result.questions).toHaveLength(1);
  });

  it('should randomize question selection', async () => {
    const input: GenerateQuizInput = {
      ...baseInput,
      subject_ids: [subjectId1, subjectId2],
      question_count: 3
    };

    // Generate multiple quizzes and check if questions vary
    const quiz1 = await generateQuiz(input);
    const quiz2 = await generateQuiz(input);
    const quiz3 = await generateQuiz(input);

    // At least one quiz should have different question selection
    // (This test might occasionally fail due to randomness, but probability is low)
    const quiz1Questions = quiz1.questions.map(q => q.id).sort();
    const quiz2Questions = quiz2.questions.map(q => q.id).sort();
    const quiz3Questions = quiz3.questions.map(q => q.id).sort();

    const allSame = JSON.stringify(quiz1Questions) === JSON.stringify(quiz2Questions) && 
                   JSON.stringify(quiz2Questions) === JSON.stringify(quiz3Questions);

    // With 5 total questions and selecting 3, there's variety in selection
    expect(allSame).toBe(false);
  });
});
