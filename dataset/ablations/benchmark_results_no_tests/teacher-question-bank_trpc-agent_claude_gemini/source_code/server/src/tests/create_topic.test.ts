import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type CreateTopicInput } from '../schema';
import { createTopic } from '../handlers/create_topic';
import { eq } from 'drizzle-orm';

// Test input for topic creation
const testSubjectInput = {
  name: 'Test Subject',
  description: 'A subject for testing'
};

const testTopicInput: CreateTopicInput = {
  name: 'Test Topic',
  description: 'A topic for testing',
  subject_id: 1 // Will be set after creating subject
};

describe('createTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a topic with all fields', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    const subject = subjectResult[0];
    const topicInput = { ...testTopicInput, subject_id: subject.id };

    const result = await createTopic(topicInput);

    // Basic field validation
    expect(result.name).toEqual('Test Topic');
    expect(result.description).toEqual('A topic for testing');
    expect(result.subject_id).toEqual(subject.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a topic with null description', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    const subject = subjectResult[0];
    const topicInput = { 
      name: 'Topic without description',
      subject_id: subject.id
    };

    const result = await createTopic(topicInput);

    expect(result.name).toEqual('Topic without description');
    expect(result.description).toBeNull();
    expect(result.subject_id).toEqual(subject.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    const subject = subjectResult[0];
    const topicInput = { ...testTopicInput, subject_id: subject.id };

    const result = await createTopic(topicInput);

    // Query the database to verify the topic was saved
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

  it('should throw error when subject does not exist', async () => {
    const topicInput = { ...testTopicInput, subject_id: 999 }; // Non-existent subject ID

    await expect(createTopic(topicInput)).rejects.toThrow(/subject with id 999 does not exist/i);
  });

  it('should create multiple topics for the same subject', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    const subject = subjectResult[0];

    // Create first topic
    const topic1Input = {
      name: 'First Topic',
      description: 'First topic description',
      subject_id: subject.id
    };
    const result1 = await createTopic(topic1Input);

    // Create second topic
    const topic2Input = {
      name: 'Second Topic', 
      description: 'Second topic description',
      subject_id: subject.id
    };
    const result2 = await createTopic(topic2Input);

    // Verify both topics exist in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.subject_id, subject.id))
      .execute();

    expect(topics).toHaveLength(2);
    expect(topics.map(t => t.name)).toContain('First Topic');
    expect(topics.map(t => t.name)).toContain('Second Topic');
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle empty description correctly', async () => {
    // Create prerequisite subject
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubjectInput)
      .returning()
      .execute();
    
    const subject = subjectResult[0];
    const topicInput = {
      name: 'Topic with undefined description',
      subject_id: subject.id
      // description is undefined
    };

    const result = await createTopic(topicInput);

    expect(result.name).toEqual('Topic with undefined description');
    expect(result.description).toBeNull();
    expect(result.subject_id).toEqual(subject.id);
  });
});
