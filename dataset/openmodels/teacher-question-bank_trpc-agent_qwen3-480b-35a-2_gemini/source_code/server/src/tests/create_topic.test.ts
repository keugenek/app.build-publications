import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type CreateTopicInput } from '../schema';
import { createTopic } from '../handlers/create_topic';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateTopicInput = {
  name: 'Test Topic',
  subject_id: 1
};

describe('createTopic', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a subject first since topic requires a subject_id
    await db.insert(subjectsTable)
      .values({ name: 'Test Subject' })
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a topic', async () => {
    const result = await createTopic(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Topic');
    expect(result.subject_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save topic to database', async () => {
    const result = await createTopic(testInput);

    // Query using proper drizzle syntax
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, result.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Test Topic');
    expect(topics[0].subject_id).toEqual(1);
    expect(topics[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail to create topic with non-existent subject', async () => {
    const invalidInput: CreateTopicInput = {
      name: 'Invalid Topic',
      subject_id: 999 // Non-existent subject ID
    };

    await expect(createTopic(invalidInput)).rejects.toThrow();
  });
});
