import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { type CreateSubjectInput, type CreateTopicInput, type UpdateTopicInput } from '../schema';
import { updateTopic } from '../handlers/update_topic';
import { eq } from 'drizzle-orm';

// Helper function to create a subject
const createSubject = async (input: CreateSubjectInput) => {
  const result = await db.insert(subjectsTable)
    .values({ name: input.name })
    .returning()
    .execute();
  return result[0];
};

// Helper function to create a topic
const createTopic = async (input: CreateTopicInput) => {
  const result = await db.insert(topicsTable)
    .values({
      name: input.name,
      subject_id: input.subject_id
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update topic name', async () => {
    // Create a subject first
    const subject = await createSubject({ name: 'Test Subject' });
    
    // Create a topic
    const topic = await createTopic({ 
      name: 'Original Topic Name', 
      subject_id: subject.id 
    });

    // Update the topic name
    const updateInput: UpdateTopicInput = {
      id: topic.id,
      name: 'Updated Topic Name'
    };

    const result = await updateTopic(updateInput);

    // Validate the returned result
    expect(result.id).toBe(topic.id);
    expect(result.name).toBe('Updated Topic Name');
    expect(result.subject_id).toBe(subject.id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify the update in the database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toBe('Updated Topic Name');
    expect(topics[0].subject_id).toBe(subject.id);
  });

  it('should update topic subject_id', async () => {
    // Create two subjects
    const subject1 = await createSubject({ name: 'Test Subject 1' });
    const subject2 = await createSubject({ name: 'Test Subject 2' });
    
    // Create a topic with subject1
    const topic = await createTopic({ 
      name: 'Test Topic', 
      subject_id: subject1.id 
    });

    // Update the topic to reference subject2
    const updateInput: UpdateTopicInput = {
      id: topic.id,
      subject_id: subject2.id
    };

    const result = await updateTopic(updateInput);

    // Validate the returned result
    expect(result.id).toBe(topic.id);
    expect(result.name).toBe(topic.name);
    expect(result.subject_id).toBe(subject2.id);

    // Verify the update in the database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].subject_id).toBe(subject2.id);
  });

  it('should update both name and subject_id', async () => {
    // Create two subjects
    const subject1 = await createSubject({ name: 'Test Subject 1' });
    const subject2 = await createSubject({ name: 'Test Subject 2' });
    
    // Create a topic with subject1
    const topic = await createTopic({ 
      name: 'Original Name', 
      subject_id: subject1.id 
    });

    // Update both name and subject_id
    const updateInput: UpdateTopicInput = {
      id: topic.id,
      name: 'New Name',
      subject_id: subject2.id
    };

    const result = await updateTopic(updateInput);

    // Validate the returned result
    expect(result.id).toBe(topic.id);
    expect(result.name).toBe('New Name');
    expect(result.subject_id).toBe(subject2.id);

    // Verify the update in the database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toBe('New Name');
    expect(topics[0].subject_id).toBe(subject2.id);
  });

  it('should throw an error when updating a non-existent topic', async () => {
    const updateInput: UpdateTopicInput = {
      id: 99999, // Non-existent ID
      name: 'New Name'
    };

    await expect(updateTopic(updateInput))
      .rejects
      .toThrow(/Topic with id 99999 not found/);
  });
});
