import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { type CreateTopicInput } from '../schema';
import { createTopic } from '../handlers/create_topic';
import { eq } from 'drizzle-orm';

describe('createTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a topic', async () => {
    // First create a subject as it's required for the foreign key
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    const testInput: CreateTopicInput = {
      name: 'Test Topic',
      subject_id: subjectId
    };

    const result = await createTopic(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Topic');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    // First create a subject as it's required for the foreign key
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    const testInput: CreateTopicInput = {
      name: 'Test Topic',
      subject_id: subjectId
    };

    const result = await createTopic(testInput);

    // Query using proper drizzle syntax
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Test Topic');
    expect(topics[0].subject_id).toEqual(subjectId);
    expect(topics[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when subject does not exist', async () => {
    const testInput: CreateTopicInput = {
      name: 'Test Topic',
      subject_id: 999 // Non-existent subject ID
    };

    await expect(createTopic(testInput)).rejects.toThrow(/Subject with id 999 not found/);
  });
});
