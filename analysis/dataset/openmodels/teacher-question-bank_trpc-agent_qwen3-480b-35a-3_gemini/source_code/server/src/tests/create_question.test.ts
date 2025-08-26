import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateQuestionInput = {
  text: 'What is the capital of France?',
  answer: 'Paris',
  subject_id: 1,
  topic_id: 1
};

describe('createQuestion', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data (subject and topic)
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Geography' })
      .returning()
      .execute();
    
    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Countries', 
        subject_id: subjectResult[0].id 
      })
      .returning()
      .execute();
    
    // Update test input with actual IDs
    Object.assign(testInput, {
      subject_id: subjectResult[0].id,
      topic_id: topicResult[0].id
    });
  });
  
  afterEach(resetDB);

  it('should create a question', async () => {
    const result = await createQuestion(testInput);

    // Basic field validation
    expect(result.text).toEqual(testInput.text);
    expect(result.answer).toEqual(testInput.answer);
    expect(result.subject_id).toEqual(testInput.subject_id);
    expect(result.topic_id).toEqual(testInput.topic_id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const result = await createQuestion(testInput);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toEqual(testInput.text);
    expect(questions[0].answer).toEqual(testInput.answer);
    expect(questions[0].subject_id).toEqual(testInput.subject_id);
    expect(questions[0].topic_id).toEqual(testInput.topic_id);
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraints properly', async () => {
    // Try to create a question with non-existent subject/topic
    const invalidInput: CreateQuestionInput = {
      text: 'Invalid question',
      answer: 'Invalid answer',
      subject_id: 99999, // Non-existent subject
      topic_id: 99999    // Non-existent topic
    };

    // This should throw a foreign key constraint error
    await expect(createQuestion(invalidInput))
      .rejects
      .toThrow(/foreign key constraint/i);
  });
});
