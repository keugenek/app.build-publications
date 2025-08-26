import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, subjectsTable, topicsTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

describe('createQuestion', () => {
  let testSubjectId: number;
  let testTopicId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    testSubjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Algebra',
        subject_id: testSubjectId
      })
      .returning()
      .execute();
    testTopicId = topicResult[0].id;
  });

  afterEach(resetDB);

  it('should create a question with valid subject and topic', async () => {
    const testInput: CreateQuestionInput = {
      text: 'What is 2 + 2?',
      subject_id: testSubjectId,
      topic_id: testTopicId
    };

    const result = await createQuestion(testInput);

    // Basic field validation
    expect(result.text).toEqual('What is 2 + 2?');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.topic_id).toEqual(testTopicId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const testInput: CreateQuestionInput = {
      text: 'Solve for x: 2x + 5 = 15',
      subject_id: testSubjectId,
      topic_id: testTopicId
    };

    const result = await createQuestion(testInput);

    // Verify question was saved in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].text).toEqual('Solve for x: 2x + 5 = 15');
    expect(questions[0].subject_id).toEqual(testSubjectId);
    expect(questions[0].topic_id).toEqual(testTopicId);
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject does not exist', async () => {
    const testInput: CreateQuestionInput = {
      text: 'What is the capital of France?',
      subject_id: 99999, // Non-existent subject ID
      topic_id: testTopicId
    };

    await expect(createQuestion(testInput))
      .rejects
      .toThrow(/subject with id 99999 does not exist/i);
  });

  it('should throw error when topic does not exist', async () => {
    const testInput: CreateQuestionInput = {
      text: 'What is the meaning of life?',
      subject_id: testSubjectId,
      topic_id: 99999 // Non-existent topic ID
    };

    await expect(createQuestion(testInput))
      .rejects
      .toThrow(/topic with id 99999 does not exist/i);
  });

  it('should throw error when topic does not belong to subject', async () => {
    // Create another subject and topic
    const anotherSubjectResult = await db.insert(subjectsTable)
      .values({ name: 'History' })
      .returning()
      .execute();
    const anotherSubjectId = anotherSubjectResult[0].id;

    const anotherTopicResult = await db.insert(topicsTable)
      .values({ 
        name: 'World War II',
        subject_id: anotherSubjectId
      })
      .returning()
      .execute();
    const anotherTopicId = anotherTopicResult[0].id;

    // Try to create question with mismatched subject and topic
    const testInput: CreateQuestionInput = {
      text: 'When did WWII end?',
      subject_id: testSubjectId, // Mathematics subject
      topic_id: anotherTopicId  // History topic
    };

    await expect(createQuestion(testInput))
      .rejects
      .toThrow(/topic with id .+ does not exist or does not belong to subject/i);
  });

  it('should create multiple questions with different topics under same subject', async () => {
    // Create another topic under the same subject
    const geometryTopicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Geometry',
        subject_id: testSubjectId
      })
      .returning()
      .execute();
    const geometryTopicId = geometryTopicResult[0].id;

    const algebraInput: CreateQuestionInput = {
      text: 'What is the quadratic formula?',
      subject_id: testSubjectId,
      topic_id: testTopicId // Algebra topic
    };

    const geometryInput: CreateQuestionInput = {
      text: 'What is the area of a circle?',
      subject_id: testSubjectId,
      topic_id: geometryTopicId // Geometry topic
    };

    const algebraResult = await createQuestion(algebraInput);
    const geometryResult = await createQuestion(geometryInput);

    // Verify both questions were created successfully
    expect(algebraResult.text).toEqual('What is the quadratic formula?');
    expect(algebraResult.topic_id).toEqual(testTopicId);
    
    expect(geometryResult.text).toEqual('What is the area of a circle?');
    expect(geometryResult.topic_id).toEqual(geometryTopicId);

    // Both should have the same subject_id
    expect(algebraResult.subject_id).toEqual(testSubjectId);
    expect(geometryResult.subject_id).toEqual(testSubjectId);
  });
});
