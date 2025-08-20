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

  it('should update topic name only', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic to update
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      name: 'Updated Topic Name'
    };

    const result = await updateTopic(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(topic[0].id);
    expect(result.name).toEqual('Updated Topic Name');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.subject_id).toEqual(subject[0].id); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update topic description only', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic to update
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Original description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      description: 'Updated description'
    };

    const result = await updateTopic(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(topic[0].id);
    expect(result.name).toEqual('Test Topic'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.subject_id).toEqual(subject[0].id); // Should remain unchanged
  });

  it('should update topic subject_id', async () => {
    // Create two subjects
    const subject1 = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original subject'
      })
      .returning()
      .execute();

    const subject2 = await db.insert(subjectsTable)
      .values({
        name: 'New Subject',
        description: 'New subject'
      })
      .returning()
      .execute();

    // Create topic with first subject
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Test description',
        subject_id: subject1[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      subject_id: subject2[0].id
    };

    const result = await updateTopic(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(topic[0].id);
    expect(result.name).toEqual('Test Topic'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.subject_id).toEqual(subject2[0].id); // Should be updated
  });

  it('should update all fields at once', async () => {
    // Create two subjects
    const subject1 = await db.insert(subjectsTable)
      .values({
        name: 'Original Subject',
        description: 'Original subject'
      })
      .returning()
      .execute();

    const subject2 = await db.insert(subjectsTable)
      .values({
        name: 'New Subject',
        description: 'New subject'
      })
      .returning()
      .execute();

    // Create topic to update
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subject1[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      name: 'Completely Updated Topic',
      description: 'Completely updated description',
      subject_id: subject2[0].id
    };

    const result = await updateTopic(updateInput);

    // Verify all fields updated
    expect(result.id).toEqual(topic[0].id);
    expect(result.name).toEqual('Completely Updated Topic');
    expect(result.description).toEqual('Completely updated description');
    expect(result.subject_id).toEqual(subject2[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic with description
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Original description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      description: null
    };

    const result = await updateTopic(updateInput);

    // Verify description set to null
    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Topic'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic to update
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      name: 'Database Updated Topic',
      description: 'Database updated description'
    };

    await updateTopic(updateInput);

    // Verify changes persisted in database
    const updatedTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic[0].id))
      .execute();

    expect(updatedTopic).toHaveLength(1);
    expect(updatedTopic[0].name).toEqual('Database Updated Topic');
    expect(updatedTopic[0].description).toEqual('Database updated description');
    expect(updatedTopic[0].subject_id).toEqual(subject[0].id);
  });

  it('should throw error when topic does not exist', async () => {
    const updateInput: UpdateTopicInput = {
      id: 999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateTopic(updateInput)).rejects.toThrow(/topic with id 999 not found/i);
  });

  it('should throw error when new subject_id does not exist', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'Test description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      subject_id: 999 // Non-existent subject ID
    };

    await expect(updateTopic(updateInput)).rejects.toThrow(/subject with id 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'Subject for testing'
      })
      .returning()
      .execute();

    // Create topic
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Update only name, leaving other fields unchanged
    const updateInput: UpdateTopicInput = {
      id: topic[0].id,
      name: 'Only Name Updated'
      // Note: description and subject_id not provided
    };

    const result = await updateTopic(updateInput);

    // Verify only name changed
    expect(result.name).toEqual('Only Name Updated');
    expect(result.description).toEqual('Original description');
    expect(result.subject_id).toEqual(subject[0].id);
  });
});
