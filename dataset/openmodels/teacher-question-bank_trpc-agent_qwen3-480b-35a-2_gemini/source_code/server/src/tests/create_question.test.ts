import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test inputs
const testSubjectInput = {
  name: 'Mathematics'
};

const testTopicInput = {
  name: 'Algebra',
  subject_id: 0 // Will be set after subject creation
};

const testQuestionInput: CreateQuestionInput = {
  text: 'What is 2 + 2?',
  type: 'Multiple Choice' as const,
  correct_answer: '4',
  subject_id: 0, // Will be set after subject creation
  topic_id: 0    // Will be set after topic creation
};

describe('createQuestion', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a subject first
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    testQuestionInput.subject_id = subjectResult[0].id;
    testTopicInput.subject_id = subjectResult[0].id;
    
    // Create a topic next
    const topicResult = await db.insert(topicsTable)
      .values(testTopicInput)
      .returning()
      .execute();
    
    testQuestionInput.topic_id = topicResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a question', async () => {
    const result = await createQuestion(testQuestionInput);

    // Basic field validation
    expect(result.text).toEqual(testQuestionInput.text);
    expect(result.type).toEqual(testQuestionInput.type);
    expect(result.correct_answer).toEqual(testQuestionInput.correct_answer);
    expect(result.subject_id).toEqual(testQuestionInput.subject_id);
    expect(result.topic_id).toEqual(testQuestionInput.topic_id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const result = await createQuestion(testQuestionInput);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toEqual(testQuestionInput.text);
    expect(questions[0].type).toEqual(testQuestionInput.type);
    expect(questions[0].correct_answer).toEqual(testQuestionInput.correct_answer);
    expect(questions[0].subject_id).toEqual(testQuestionInput.subject_id);
    expect(questions[0].topic_id).toEqual(testQuestionInput.topic_id);
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different question types', async () => {
    // Test with Open Ended question type
    const openEndedInput: CreateQuestionInput = {
      ...testQuestionInput,
      type: 'Open Ended' as const,
      text: 'Explain the Pythagorean theorem',
      correct_answer: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides'
    };

    const result = await createQuestion(openEndedInput);

    expect(result.type).toEqual('Open Ended');
    expect(result.text).toEqual(openEndedInput.text);
    expect(result.correct_answer).toEqual(openEndedInput.correct_answer);
  });
});
