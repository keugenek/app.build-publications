import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { topicsTable, subjectsTable } from '../db/schema';
import { type UpdateTopicInput, type CreateSubjectInput } from '../schema';
import { updateTopic } from '../handlers/update_topic';
import { eq } from 'drizzle-orm';

// Test data
const testSubject: CreateSubjectInput = {
  name: 'Mathematics',
  description: 'Math subject for testing'
};

const anotherSubject: CreateSubjectInput = {
  name: 'Science',
  description: 'Science subject for testing'
};

describe('updateTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let subjectId: number;
  let anotherSubjectId: number;
  let topicId: number;

  beforeEach(async () => {
    // Create test subjects
    const subjectResult = await db.insert(subjectsTable)
      .values(testSubject)
      .returning()
      .execute();
    subjectId = subjectResult[0].id;

    const anotherSubjectResult = await db.insert(subjectsTable)
      .values(anotherSubject)
      .returning()
      .execute();
    anotherSubjectId = anotherSubjectResult[0].id;

    // Create a test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Original Topic',
        description: 'Original description',
        subject_id: subjectId
      })
      .returning()
      .execute();
    topicId = topicResult[0].id;
  });

  it('should update topic name only', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      name: 'Updated Topic Name'
    };

    const result = await updateTopic(updateInput);

    expect(result.id).toEqual(topicId);
    expect(result.name).toEqual('Updated Topic Name');
    expect(result.description).toEqual('Original description');
    expect(result.subject_id).toEqual(subjectId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update topic description only', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      description: 'Updated description'
    };

    const result = await updateTopic(updateInput);

    expect(result.id).toEqual(topicId);
    expect(result.name).toEqual('Original Topic');
    expect(result.description).toEqual('Updated description');
    expect(result.subject_id).toEqual(subjectId);
  });

  it('should update topic subject_id only', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      subject_id: anotherSubjectId
    };

    const result = await updateTopic(updateInput);

    expect(result.id).toEqual(topicId);
    expect(result.name).toEqual('Original Topic');
    expect(result.description).toEqual('Original description');
    expect(result.subject_id).toEqual(anotherSubjectId);
  });

  it('should update all topic fields at once', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      name: 'Completely Updated Topic',
      description: 'Completely updated description',
      subject_id: anotherSubjectId
    };

    const result = await updateTopic(updateInput);

    expect(result.id).toEqual(topicId);
    expect(result.name).toEqual('Completely Updated Topic');
    expect(result.description).toEqual('Completely updated description');
    expect(result.subject_id).toEqual(anotherSubjectId);
  });

  it('should set description to null', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      description: null
    };

    const result = await updateTopic(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Topic'); // Other fields unchanged
  });

  it('should save updated topic to database', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      name: 'Database Updated Topic',
      description: 'Database updated description'
    };

    await updateTopic(updateInput);

    // Verify changes in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicId))
      .execute();

    expect(topics).toHaveLength(1);
    expect(topics[0].name).toEqual('Database Updated Topic');
    expect(topics[0].description).toEqual('Database updated description');
    expect(topics[0].subject_id).toEqual(subjectId);
  });

  it('should throw error for non-existent topic', async () => {
    const updateInput: UpdateTopicInput = {
      id: 999999, // Non-existent ID
      name: 'Should Fail'
    };

    await expect(updateTopic(updateInput)).rejects.toThrow(/Topic with id 999999 not found/i);
  });

  it('should throw error for non-existent subject_id', async () => {
    const updateInput: UpdateTopicInput = {
      id: topicId,
      subject_id: 999999 // Non-existent subject ID
    };

    await expect(updateTopic(updateInput)).rejects.toThrow(/Subject with id 999999 not found/i);
  });

  it('should validate subject_id exists when updating', async () => {
    // Create another topic
    const anotherTopicResult = await db.insert(topicsTable)
      .values({
        name: 'Another Topic',
        description: 'Another description',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const updateInput: UpdateTopicInput = {
      id: anotherTopicResult[0].id,
      name: 'Updated with valid subject',
      subject_id: anotherSubjectId
    };

    const result = await updateTopic(updateInput);

    expect(result.name).toEqual('Updated with valid subject');
    expect(result.subject_id).toEqual(anotherSubjectId);
  });

  it('should handle partial updates correctly', async () => {
    // First update: only name
    await updateTopic({
      id: topicId,
      name: 'First Update'
    });

    // Second update: only description
    await updateTopic({
      id: topicId,
      description: 'Second Update Description'
    });

    // Third update: only subject_id
    const finalResult = await updateTopic({
      id: topicId,
      subject_id: anotherSubjectId
    });

    expect(finalResult.name).toEqual('First Update');
    expect(finalResult.description).toEqual('Second Update Description');
    expect(finalResult.subject_id).toEqual(anotherSubjectId);
  });
});
