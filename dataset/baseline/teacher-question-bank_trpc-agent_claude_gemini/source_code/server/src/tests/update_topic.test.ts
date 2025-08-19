import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type UpdateTopicInput } from '../schema';
import { updateTopic } from '../handlers/update_topic';
import { eq } from 'drizzle-orm';

describe('updateTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update topic name', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      name: 'Updated Topic Name'
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Updated Topic Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.subject_id).toEqual(subjectResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update topic description', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      description: 'Updated description'
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Test Topic'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.subject_id).toEqual(subjectResult[0].id);
  });

  it('should update topic subject_id', async () => {
    // Create two test subjects
    const subject1Result = await db.insert(subjectsTable)
      .values({
        name: 'Subject 1',
        description: 'First subject'
      })
      .returning()
      .execute();

    const subject2Result = await db.insert(subjectsTable)
      .values({
        name: 'Subject 2',
        description: 'Second subject'
      })
      .returning()
      .execute();

    // Create topic under first subject
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Test description',
        subject_id: subject1Result[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      subject_id: subject2Result[0].id
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Test Topic');
    expect(result.description).toEqual('Test description');
    expect(result.subject_id).toEqual(subject2Result[0].id); // Should be updated
  });

  it('should update multiple fields at once', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      name: 'Updated Topic Name',
      description: 'Updated description'
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Updated Topic Name');
    expect(result.description).toEqual('Updated description');
    expect(result.subject_id).toEqual(subjectResult[0].id);
  });

  it('should update description to null', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      description: null
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Test Topic');
    expect(result.description).toBeNull();
    expect(result.subject_id).toEqual(subjectResult[0].id);
  });

  it('should save changes to database', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      name: 'Database Updated Topic'
    };

    await updateTopic(input);

    // Verify changes were saved to database
    const updatedTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicResult[0].id))
      .execute();

    expect(updatedTopics).toHaveLength(1);
    expect(updatedTopics[0].name).toEqual('Database Updated Topic');
    expect(updatedTopics[0].description).toEqual('Original description');
  });

  it('should throw error when topic does not exist', async () => {
    const input: UpdateTopicInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateTopic(input)).rejects.toThrow(/Topic with id 999999 not found/i);
  });

  it('should throw error when subject_id does not exist', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Test description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    const input: UpdateTopicInput = {
      id: topicResult[0].id,
      subject_id: 999999 // Non-existent subject ID
    };

    await expect(updateTopic(input)).rejects.toThrow(/Subject with id 999999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create test subject and topic
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subjectResult[0].id
      })
      .returning()
      .execute();

    // Update with empty object (no fields to update)
    const input: UpdateTopicInput = {
      id: topicResult[0].id
    };

    const result = await updateTopic(input);

    // All fields should remain unchanged
    expect(result.id).toEqual(topicResult[0].id);
    expect(result.name).toEqual('Original Topic');
    expect(result.description).toEqual('Original description');
    expect(result.subject_id).toEqual(subjectResult[0].id);
  });
});
