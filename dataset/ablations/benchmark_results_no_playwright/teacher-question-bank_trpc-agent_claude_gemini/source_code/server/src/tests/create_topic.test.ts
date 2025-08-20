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

  it('should create a topic successfully', async () => {
    // First create a subject for the topic
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    const testInput: CreateTopicInput = {
      name: 'Algebra',
      subject_id: subjectId
    };

    const result = await createTopic(testInput);

    // Validate returned topic
    expect(result.name).toEqual('Algebra');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    // Create a subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Science' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    const testInput: CreateTopicInput = {
      name: 'Physics',
      subject_id: subjectId
    };

    const result = await createTopic(testInput);

    // Query the database to verify the topic was saved
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Physics');
    expect(topics[0].subject_id).toEqual(subjectId);
    expect(topics[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject does not exist', async () => {
    const testInput: CreateTopicInput = {
      name: 'History',
      subject_id: 999 // Non-existent subject ID
    };

    await expect(createTopic(testInput)).rejects.toThrow(/Subject with id 999 does not exist/i);
  });

  it('should create multiple topics for the same subject', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'English' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Create first topic
    const firstInput: CreateTopicInput = {
      name: 'Grammar',
      subject_id: subjectId
    };

    // Create second topic
    const secondInput: CreateTopicInput = {
      name: 'Literature',
      subject_id: subjectId
    };

    const firstResult = await createTopic(firstInput);
    const secondResult = await createTopic(secondInput);

    // Verify both topics were created with different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.subject_id).toEqual(subjectId);
    expect(secondResult.subject_id).toEqual(subjectId);
    expect(firstResult.name).toEqual('Grammar');
    expect(secondResult.name).toEqual('Literature');

    // Verify both are in the database
    const allTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subjectId))
      .execute();

    expect(allTopics).toHaveLength(2);
    const topicNames = allTopics.map(topic => topic.name).sort();
    expect(topicNames).toEqual(['Grammar', 'Literature']);
  });

  it('should handle topics with special characters in name', async () => {
    // Create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Computer Science' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    const testInput: CreateTopicInput = {
      name: 'Data Structures & Algorithms',
      subject_id: subjectId
    };

    const result = await createTopic(testInput);

    expect(result.name).toEqual('Data Structures & Algorithms');
    expect(result.subject_id).toEqual(subjectId);

    // Verify in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics[0].name).toEqual('Data Structures & Algorithms');
  });
});
