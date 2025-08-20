import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type CreateTopicInput } from '../schema';
import { createTopic } from '../handlers/create_topic';
import { eq } from 'drizzle-orm';

describe('createTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testSubjectId: number;

  beforeEach(async () => {
    // Create a subject first since topics need a valid subject_id
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing topics'
      })
      .returning()
      .execute();
    
    testSubjectId = subjectResult[0].id;
  });

  it('should create a topic with all fields', async () => {
    const testInput: CreateTopicInput = {
      name: 'Test Topic',
      description: 'A topic for testing',
      subject_id: testSubjectId
    };

    const result = await createTopic(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Topic');
    expect(result.description).toEqual('A topic for testing');
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a topic with null description', async () => {
    const testInput: CreateTopicInput = {
      name: 'Topic No Description',
      description: null,
      subject_id: testSubjectId
    };

    const result = await createTopic(testInput);

    expect(result.name).toEqual('Topic No Description');
    expect(result.description).toBeNull();
    expect(result.subject_id).toEqual(testSubjectId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    const testInput: CreateTopicInput = {
      name: 'Persistent Topic',
      description: 'This should be saved to DB',
      subject_id: testSubjectId
    };

    const result = await createTopic(testInput);

    // Query the database to verify the topic was saved
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Persistent Topic');
    expect(topics[0].description).toEqual('This should be saved to DB');
    expect(topics[0].subject_id).toEqual(testSubjectId);
    expect(topics[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject does not exist', async () => {
    const nonExistentSubjectId = 99999;
    const testInput: CreateTopicInput = {
      name: 'Invalid Topic',
      description: 'This should fail',
      subject_id: nonExistentSubjectId
    };

    await expect(createTopic(testInput)).rejects.toThrow(/subject with id 99999 does not exist/i);
  });

  it('should create multiple topics for the same subject', async () => {
    const testInput1: CreateTopicInput = {
      name: 'First Topic',
      description: 'First topic description',
      subject_id: testSubjectId
    };

    const testInput2: CreateTopicInput = {
      name: 'Second Topic',
      description: 'Second topic description',
      subject_id: testSubjectId
    };

    const result1 = await createTopic(testInput1);
    const result2 = await createTopic(testInput2);

    // Both topics should be created successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('First Topic');
    expect(result2.name).toEqual('Second Topic');
    expect(result1.subject_id).toEqual(testSubjectId);
    expect(result2.subject_id).toEqual(testSubjectId);

    // Verify both are in database
    const allTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, testSubjectId))
      .execute();

    expect(allTopics).toHaveLength(2);
    const names = allTopics.map(t => t.name).sort();
    expect(names).toEqual(['First Topic', 'Second Topic']);
  });

  it('should handle topic with long name', async () => {
    const longName = 'A'.repeat(200); // Very long topic name
    const testInput: CreateTopicInput = {
      name: longName,
      description: 'Testing long names',
      subject_id: testSubjectId
    };

    const result = await createTopic(testInput);

    expect(result.name).toEqual(longName);
    expect(result.description).toEqual('Testing long names');
    expect(result.subject_id).toEqual(testSubjectId);
  });
});
