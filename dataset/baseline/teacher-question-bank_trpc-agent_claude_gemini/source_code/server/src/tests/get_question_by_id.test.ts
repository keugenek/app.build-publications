import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getQuestionById } from '../handlers/get_question_by_id';
import { eq } from 'drizzle-orm';

describe('getQuestionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a question by ID', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'What is the capital of France?',
        option_a: 'London',
        option_b: 'Berlin',
        option_c: 'Paris',
        option_d: 'Madrid',
        correct_answer: 'C',
        explanation: 'Paris is the capital city of France',
        difficulty_level: 'easy',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: GetByIdInput = {
      id: questionResult[0].id
    };

    const result = await getQuestionById(input);

    // Verify question details
    expect(result.id).toEqual(questionResult[0].id);
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.option_a).toEqual('London');
    expect(result.option_b).toEqual('Berlin');
    expect(result.option_c).toEqual('Paris');
    expect(result.option_d).toEqual('Madrid');
    expect(result.correct_answer).toEqual('C');
    expect(result.explanation).toEqual('Paris is the capital city of France');
    expect(result.difficulty_level).toEqual('easy');
    expect(result.subject_id).toEqual(subjectResult[0].id);
    expect(result.topic_id).toEqual(topicResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle questions with null explanation', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Sample question without explanation?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        explanation: null,
        difficulty_level: 'medium',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: GetByIdInput = {
      id: questionResult[0].id
    };

    const result = await getQuestionById(input);

    expect(result.explanation).toBeNull();
    expect(result.question_text).toEqual('Sample question without explanation?');
    expect(result.difficulty_level).toEqual('medium');
  });

  it('should handle hard difficulty questions', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Advanced Subject',
        description: null
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Advanced Topic',
        description: null,
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Complex calculus question?',
        option_a: 'Answer A',
        option_b: 'Answer B',
        option_c: 'Answer C',
        option_d: 'Answer D',
        correct_answer: 'D',
        explanation: 'This requires advanced knowledge',
        difficulty_level: 'hard',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: GetByIdInput = {
      id: questionResult[0].id
    };

    const result = await getQuestionById(input);

    expect(result.difficulty_level).toEqual('hard');
    expect(result.correct_answer).toEqual('D');
    expect(result.question_text).toEqual('Complex calculus question?');
  });

  it('should throw error when question does not exist', async () => {
    const input: GetByIdInput = {
      id: 999999
    };

    await expect(getQuestionById(input)).rejects.toThrow(/Question with ID 999999 not found/i);
  });

  it('should verify question is stored correctly in database', async () => {
    // Create prerequisite data
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const questionResult = await db.insert(questionsTable)
      .values({
        question_text: 'Database verification question?',
        option_a: 'True',
        option_b: 'False',
        option_c: 'Maybe',
        option_d: 'Unknown',
        correct_answer: 'B',
        explanation: 'Explanation for verification',
        difficulty_level: 'medium',
        subject_id: subjectResult[0].id,
        topic_id: topicResult[0].id
      })
      .returning()
      .execute();

    const input: GetByIdInput = {
      id: questionResult[0].id
    };

    const result = await getQuestionById(input);

    // Verify by querying database directly
    const dbQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(dbQuestions).toHaveLength(1);
    expect(dbQuestions[0].question_text).toEqual('Database verification question?');
    expect(dbQuestions[0].correct_answer).toEqual('B');
    expect(dbQuestions[0].difficulty_level).toEqual('medium');
    expect(dbQuestions[0].created_at).toBeInstanceOf(Date);
    expect(dbQuestions[0].updated_at).toBeInstanceOf(Date);
  });
});
