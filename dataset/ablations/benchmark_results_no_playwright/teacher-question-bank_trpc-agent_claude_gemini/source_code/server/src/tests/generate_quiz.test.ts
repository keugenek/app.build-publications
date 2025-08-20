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

  // Create test data helper
  const createTestData = async () => {
    // Create subjects
    const subjects = await db.insert(subjectsTable)
      .values([
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'History' }
      ])
      .returning()
      .execute();

    // Create topics
    const topics = await db.insert(topicsTable)
      .values([
        { name: 'Algebra', subject_id: subjects[0].id },
        { name: 'Geometry', subject_id: subjects[0].id },
        { name: 'Biology', subject_id: subjects[1].id },
        { name: 'Chemistry', subject_id: subjects[1].id },
        { name: 'World War I', subject_id: subjects[2].id }
      ])
      .returning()
      .execute();

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        { text: 'What is 2+2?', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'Solve for x: x+5=10', subject_id: subjects[0].id, topic_id: topics[0].id },
        { text: 'What is the area of a circle?', subject_id: subjects[0].id, topic_id: topics[1].id },
        { text: 'What is DNA?', subject_id: subjects[1].id, topic_id: topics[2].id },
        { text: 'What is H2O?', subject_id: subjects[1].id, topic_id: topics[3].id },
        { text: 'When did WWI start?', subject_id: subjects[2].id, topic_id: topics[4].id }
      ])
      .returning()
      .execute();

    return { subjects, topics, questions };
  };

  it('should create a quiz with no filters', async () => {
    const { questions } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'General Knowledge Quiz'
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('General Knowledge Quiz');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify quiz exists in database
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('General Knowledge Quiz');

    // Verify all questions were associated with the quiz
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(questions.length);
  });

  it('should create a quiz filtered by subject_ids', async () => {
    const { subjects } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Math Quiz',
      subject_ids: [subjects[0].id] // Mathematics only
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Math Quiz');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify only math questions were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(3); // 3 math questions

    // Verify all associated questions are from the correct subject
    for (const qz of quizQuestions) {
      const question = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, qz.question_id))
        .execute();

      expect(question[0].subject_id).toEqual(subjects[0].id);
    }
  });

  it('should create a quiz filtered by topic_ids', async () => {
    const { topics } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Algebra Quiz',
      topic_ids: [topics[0].id] // Algebra only
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Algebra Quiz');

    // Verify only algebra questions were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(2); // 2 algebra questions

    // Verify all associated questions are from the correct topic
    for (const qz of quizQuestions) {
      const question = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, qz.question_id))
        .execute();

      expect(question[0].topic_id).toEqual(topics[0].id);
    }
  });

  it('should create a quiz with both subject_ids and topic_ids filters', async () => {
    const { subjects, topics } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Science Biology Quiz',
      subject_ids: [subjects[1].id], // Science
      topic_ids: [topics[2].id] // Biology
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Science Biology Quiz');

    // Verify only biology questions from science subject were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(1); // 1 biology question

    // Verify the question matches both filters
    const question = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, quizQuestions[0].question_id))
      .execute();

    expect(question[0].subject_id).toEqual(subjects[1].id);
    expect(question[0].topic_id).toEqual(topics[2].id);
  });

  it('should create a quiz with limit applied', async () => {
    await createTestData();

    const input: GenerateQuizInput = {
      title: 'Limited Quiz',
      limit: 3
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Limited Quiz');

    // Verify only 3 questions were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(3);
  });

  it('should create a quiz with multiple subject_ids', async () => {
    const { subjects } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Math and Science Quiz',
      subject_ids: [subjects[0].id, subjects[1].id] // Math and Science
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Math and Science Quiz');

    // Verify questions from both subjects were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(5); // 3 math + 2 science questions

    // Verify all questions are from the specified subjects
    for (const qz of quizQuestions) {
      const question = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, qz.question_id))
        .execute();

      expect([subjects[0].id, subjects[1].id]).toContain(question[0].subject_id);
    }
  });

  it('should create a quiz with multiple topic_ids', async () => {
    const { topics } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Algebra and Biology Quiz',
      topic_ids: [topics[0].id, topics[2].id] // Algebra and Biology
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Algebra and Biology Quiz');

    // Verify questions from both topics were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(3); // 2 algebra + 1 biology questions

    // Verify all questions are from the specified topics
    for (const qz of quizQuestions) {
      const question = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, qz.question_id))
        .execute();

      expect([topics[0].id, topics[2].id]).toContain(question[0].topic_id);
    }
  });

  it('should create a quiz with no questions when filters match nothing', async () => {
    await createTestData();

    const input: GenerateQuizInput = {
      title: 'Empty Quiz',
      subject_ids: [999] // Non-existent subject
    };

    const result = await generateQuiz(input);

    // Verify quiz was created even with no questions
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Empty Quiz');

    // Verify no questions were associated
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(0);
  });

  it('should create a quiz with empty filter arrays', async () => {
    const { questions } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Quiz with Empty Arrays',
      subject_ids: [],
      topic_ids: []
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Quiz with Empty Arrays');

    // Verify all questions were associated (empty arrays should be ignored)
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(questions.length);
  });

  it('should apply limit with filters correctly', async () => {
    const { subjects } = await createTestData();

    const input: GenerateQuizInput = {
      title: 'Limited Math Quiz',
      subject_ids: [subjects[0].id], // Mathematics (has 3 questions)
      limit: 2
    };

    const result = await generateQuiz(input);

    // Verify quiz was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Limited Math Quiz');

    // Verify only 2 questions were associated despite 3 being available
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, result.id))
      .execute();

    expect(quizQuestions).toHaveLength(2);

    // Verify all questions are from math subject
    for (const qz of quizQuestions) {
      const question = await db.select()
        .from(questionsTable)
        .where(eq(questionsTable.id, qz.question_id))
        .execute();

      expect(question[0].subject_id).toEqual(subjects[0].id);
    }
  });
});
