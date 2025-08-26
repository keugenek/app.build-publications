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

  let testSubject1Id: number;
  let testSubject2Id: number;
  let testTopicId: number;

  beforeEach(async () => {
    // Create test subjects
    const subject1Result = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    testSubject1Id = subject1Result[0].id;

    const subject2Result = await db.insert(subjectsTable)
      .values({ name: 'Physics' })
      .returning()
      .execute();
    testSubject2Id = subject2Result[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Algebra',
        subject_id: testSubject1Id
      })
      .returning()
      .execute();
    testTopicId = topicResult[0].id;
  });

  it('should update topic name only', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId,
      name: 'Advanced Algebra'
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(testTopicId);
    expect(result.name).toEqual('Advanced Algebra');
    expect(result.subject_id).toEqual(testSubject1Id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, testTopicId))
      .execute();

    expect(dbTopic[0].name).toEqual('Advanced Algebra');
    expect(dbTopic[0].subject_id).toEqual(testSubject1Id);
  });

  it('should update subject_id only', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId,
      subject_id: testSubject2Id
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(testTopicId);
    expect(result.name).toEqual('Algebra');
    expect(result.subject_id).toEqual(testSubject2Id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, testTopicId))
      .execute();

    expect(dbTopic[0].name).toEqual('Algebra');
    expect(dbTopic[0].subject_id).toEqual(testSubject2Id);
  });

  it('should update both name and subject_id', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId,
      name: 'Quantum Mechanics',
      subject_id: testSubject2Id
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(testTopicId);
    expect(result.name).toEqual('Quantum Mechanics');
    expect(result.subject_id).toEqual(testSubject2Id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const dbTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, testTopicId))
      .execute();

    expect(dbTopic[0].name).toEqual('Quantum Mechanics');
    expect(dbTopic[0].subject_id).toEqual(testSubject2Id);
  });

  it('should return unchanged topic when no fields provided', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId
    };

    const result = await updateTopic(input);

    expect(result.id).toEqual(testTopicId);
    expect(result.name).toEqual('Algebra');
    expect(result.subject_id).toEqual(testSubject1Id);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify no change in database
    const dbTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, testTopicId))
      .execute();

    expect(dbTopic[0].name).toEqual('Algebra');
    expect(dbTopic[0].subject_id).toEqual(testSubject1Id);
  });

  it('should throw error when topic does not exist', async () => {
    const input: UpdateTopicInput = {
      id: 99999,
      name: 'Non-existent Topic'
    };

    await expect(updateTopic(input)).rejects.toThrow(/Topic with id 99999 not found/i);
  });

  it('should throw error when subject_id does not exist', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId,
      subject_id: 99999
    };

    await expect(updateTopic(input)).rejects.toThrow(/Subject with id 99999 not found/i);
  });

  it('should preserve original created_at timestamp', async () => {
    // Get original timestamp
    const originalTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, testTopicId))
      .execute();

    const originalCreatedAt = originalTopic[0].created_at;

    // Wait a small amount to ensure timestamps would be different
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTopicInput = {
      id: testTopicId,
      name: 'Updated Name'
    };

    const result = await updateTopic(input);

    expect(result.created_at).toEqual(originalCreatedAt);
  });

  it('should handle valid edge case values', async () => {
    const input: UpdateTopicInput = {
      id: testTopicId,
      name: 'A' // Minimum valid name length
    };

    const result = await updateTopic(input);

    expect(result.name).toEqual('A');
    expect(result.id).toEqual(testTopicId);
  });
});
