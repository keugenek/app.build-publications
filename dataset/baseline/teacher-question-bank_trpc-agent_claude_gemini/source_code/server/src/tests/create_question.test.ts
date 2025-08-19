import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let subjectId: number;
  let topicId: number;

  beforeEach(async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics',
        description: 'Math subject for testing'
      })
      .returning()
      .execute();
    
    subjectId = subjectResult[0].id;

    // Create prerequisite topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        description: 'Basic algebra',
        subject_id: subjectId
      })
      .returning()
      .execute();

    topicId = topicResult[0].id;
  });

  const testInput: CreateQuestionInput = {
    question_text: 'What is 2 + 2?',
    option_a: '3',
    option_b: '4',
    option_c: '5',
    option_d: '6',
    correct_answer: 'B',
    explanation: 'Basic addition: 2 + 2 equals 4',
    difficulty_level: 'easy',
    subject_id: 0, // Will be set in beforeEach
    topic_id: 0 // Will be set in beforeEach
  };

  it('should create a question with valid input', async () => {
    const input = { ...testInput, subject_id: subjectId, topic_id: topicId };
    const result = await createQuestion(input);

    // Validate all fields are properly set
    expect(result.id).toBeDefined();
    expect(result.question_text).toEqual('What is 2 + 2?');
    expect(result.option_a).toEqual('3');
    expect(result.option_b).toEqual('4');
    expect(result.option_c).toEqual('5');
    expect(result.option_d).toEqual('6');
    expect(result.correct_answer).toEqual('B');
    expect(result.explanation).toEqual('Basic addition: 2 + 2 equals 4');
    expect(result.difficulty_level).toEqual('easy');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.topic_id).toEqual(topicId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const input = { ...testInput, subject_id: subjectId, topic_id: topicId };
    const result = await createQuestion(input);

    // Query database to verify the question was saved
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    const savedQuestion = questions[0];
    
    expect(savedQuestion.question_text).toEqual('What is 2 + 2?');
    expect(savedQuestion.option_a).toEqual('3');
    expect(savedQuestion.option_b).toEqual('4');
    expect(savedQuestion.option_c).toEqual('5');
    expect(savedQuestion.option_d).toEqual('6');
    expect(savedQuestion.correct_answer).toEqual('B');
    expect(savedQuestion.explanation).toEqual('Basic addition: 2 + 2 equals 4');
    expect(savedQuestion.difficulty_level).toEqual('easy');
    expect(savedQuestion.subject_id).toEqual(subjectId);
    expect(savedQuestion.topic_id).toEqual(topicId);
    expect(savedQuestion.created_at).toBeInstanceOf(Date);
    expect(savedQuestion.updated_at).toBeInstanceOf(Date);
  });

  it('should create question with null explanation', async () => {
    const input = { 
      ...testInput, 
      subject_id: subjectId, 
      topic_id: topicId,
      explanation: null 
    };
    const result = await createQuestion(input);

    expect(result.explanation).toBeNull();
    
    // Verify in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions[0].explanation).toBeNull();
  });

  it('should create question with different difficulty levels', async () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      const input = { 
        ...testInput, 
        subject_id: subjectId, 
        topic_id: topicId,
        difficulty_level: difficulty,
        question_text: `Test question for ${difficulty} level`
      };
      
      const result = await createQuestion(input);
      expect(result.difficulty_level).toEqual(difficulty);
      expect(result.question_text).toEqual(`Test question for ${difficulty} level`);
    }
  });

  it('should create question with different correct answers', async () => {
    const correctAnswers: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

    for (const answer of correctAnswers) {
      const input = { 
        ...testInput, 
        subject_id: subjectId, 
        topic_id: topicId,
        correct_answer: answer,
        question_text: `Test question with correct answer ${answer}`
      };
      
      const result = await createQuestion(input);
      expect(result.correct_answer).toEqual(answer);
      expect(result.question_text).toEqual(`Test question with correct answer ${answer}`);
    }
  });

  it('should throw error when subject does not exist', async () => {
    const input = { ...testInput, subject_id: 99999, topic_id: topicId };

    await expect(createQuestion(input)).rejects.toThrow(/subject with id 99999 not found/i);
  });

  it('should throw error when topic does not exist', async () => {
    const input = { ...testInput, subject_id: subjectId, topic_id: 99999 };

    await expect(createQuestion(input)).rejects.toThrow(/topic with id 99999 not found/i);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Create another subject
    const anotherSubjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Science',
        description: 'Science subject'
      })
      .returning()
      .execute();

    const anotherSubjectId = anotherSubjectResult[0].id;

    // Try to create question with topic from different subject
    const input = { 
      ...testInput, 
      subject_id: anotherSubjectId, 
      topic_id: topicId // This topic belongs to Math, not Science
    };

    await expect(createQuestion(input)).rejects.toThrow(
      new RegExp(`topic ${topicId} does not belong to subject ${anotherSubjectId}`, 'i')
    );
  });

  it('should handle multiple questions creation correctly', async () => {
    const questions = [
      { ...testInput, subject_id: subjectId, topic_id: topicId, question_text: 'Question 1' },
      { ...testInput, subject_id: subjectId, topic_id: topicId, question_text: 'Question 2' },
      { ...testInput, subject_id: subjectId, topic_id: topicId, question_text: 'Question 3' }
    ];

    const results = await Promise.all(questions.map(q => createQuestion(q)));

    // All questions should have unique IDs
    const ids = results.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(3);

    // Verify all questions have correct text
    expect(results[0].question_text).toEqual('Question 1');
    expect(results[1].question_text).toEqual('Question 2');
    expect(results[2].question_text).toEqual('Question 3');

    // Verify all questions are saved in database
    const savedQuestions = await db.select()
      .from(questionsTable)
      .execute();

    expect(savedQuestions.length).toBeGreaterThanOrEqual(3);
  });
});
