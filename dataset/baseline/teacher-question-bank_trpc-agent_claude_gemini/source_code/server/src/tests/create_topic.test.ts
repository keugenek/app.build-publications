import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type CreateTopicInput } from '../schema';
import { createTopic } from '../handlers/create_topic';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTopicInput = {
  name: 'Test Topic',
  description: 'A topic for testing',
  subject_id: 1
};

describe('createTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a topic with valid subject', async () => {
    // First create a subject to reference
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const subject = subjectResult[0];

    // Create topic with valid subject_id
    const topicInput: CreateTopicInput = {
      ...testInput,
      subject_id: subject.id
    };

    const result = await createTopic(topicInput);

    // Basic field validation
    expect(result.name).toEqual('Test Topic');
    expect(result.description).toEqual('A topic for testing');
    expect(result.subject_id).toEqual(subject.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const subject = subjectResult[0];

    const topicInput: CreateTopicInput = {
      ...testInput,
      subject_id: subject.id
    };

    const result = await createTopic(topicInput);

    // Query database to verify topic was saved
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Test Topic');
    expect(topics[0].description).toEqual('A topic for testing');
    expect(topics[0].subject_id).toEqual(subject.id);
    expect(topics[0].created_at).toBeInstanceOf(Date);
  });

  it('should create topic with null description', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: null
      })
      .returning()
      .execute();

    const subject = subjectResult[0];

    const topicInput: CreateTopicInput = {
      name: 'Topic Without Description',
      description: null,
      subject_id: subject.id
    };

    const result = await createTopic(topicInput);

    expect(result.name).toEqual('Topic Without Description');
    expect(result.description).toBeNull();
    expect(result.subject_id).toEqual(subject.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when subject does not exist', async () => {
    // Use non-existent subject_id
    const topicInput: CreateTopicInput = {
      ...testInput,
      subject_id: 999 // Non-existent subject ID
    };

    await expect(createTopic(topicInput)).rejects.toThrow(/Subject with id 999 does not exist/i);
  });

  it('should create multiple topics for same subject', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const subject = subjectResult[0];

    // Create first topic
    const topic1Input: CreateTopicInput = {
      name: 'Topic 1',
      description: 'First topic',
      subject_id: subject.id
    };

    // Create second topic
    const topic2Input: CreateTopicInput = {
      name: 'Topic 2',
      description: 'Second topic',
      subject_id: subject.id
    };

    const result1 = await createTopic(topic1Input);
    const result2 = await createTopic(topic2Input);

    // Both topics should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.subject_id).toEqual(subject.id);
    expect(result2.subject_id).toEqual(subject.id);

    // Verify both topics exist in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subject.id))
      .execute();

    expect(topics).toHaveLength(2);
  });

  it('should preserve timestamps correctly', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const subject = subjectResult[0];

    const topicInput: CreateTopicInput = {
      ...testInput,
      subject_id: subject.id
    };

    const beforeCreate = new Date();
    const result = await createTopic(topicInput);
    const afterCreate = new Date();

    // Check that created_at is within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
  });
});
