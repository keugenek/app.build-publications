import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type DeleteTopicInput } from '../schema';
import { deleteTopic } from '../handlers/delete_topic';
import { eq } from 'drizzle-orm';

describe('deleteTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a topic successfully', async () => {
    // Create test subject first
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    const input: DeleteTopicInput = {
      id: topicId
    };

    const result = await deleteTopic(input);

    expect(result.success).toBe(true);

    // Verify the topic was deleted from database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicId))
      .execute();

    expect(topics).toHaveLength(0);
  });

  it('should cascade delete related questions when deleting a topic', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topic
    const topicResult = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        subject_id: subjectId
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Create test questions related to this topic
    await db.insert(questionsTable)
      .values([
        {
          text: 'Test Question 1',
          subject_id: subjectId,
          topic_id: topicId
        },
        {
          text: 'Test Question 2',
          subject_id: subjectId,
          topic_id: topicId
        }
      ])
      .execute();

    // Verify questions exist before deletion
    const questionsBeforeDeletion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicId))
      .execute();

    expect(questionsBeforeDeletion).toHaveLength(2);

    const input: DeleteTopicInput = {
      id: topicId
    };

    const result = await deleteTopic(input);

    expect(result.success).toBe(true);

    // Verify the topic was deleted
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicId))
      .execute();

    expect(topics).toHaveLength(0);

    // Verify related questions were cascade deleted
    const questionsAfterDeletion = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicId))
      .execute();

    expect(questionsAfterDeletion).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent topic', async () => {
    const input: DeleteTopicInput = {
      id: 99999 // Non-existent topic ID
    };

    expect(deleteTopic(input)).rejects.toThrow(/topic with id 99999 not found/i);
  });

  it('should not affect other topics when deleting one topic', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create multiple test topics
    const topicResults = await db.insert(topicsTable)
      .values([
        {
          name: 'Topic to Delete',
          subject_id: subjectId
        },
        {
          name: 'Topic to Keep',
          subject_id: subjectId
        }
      ])
      .returning()
      .execute();

    const topicToDeleteId = topicResults[0].id;
    const topicToKeepId = topicResults[1].id;

    // Create questions for both topics
    await db.insert(questionsTable)
      .values([
        {
          text: 'Question for topic to delete',
          subject_id: subjectId,
          topic_id: topicToDeleteId
        },
        {
          text: 'Question for topic to keep',
          subject_id: subjectId,
          topic_id: topicToKeepId
        }
      ])
      .execute();

    const input: DeleteTopicInput = {
      id: topicToDeleteId
    };

    const result = await deleteTopic(input);

    expect(result.success).toBe(true);

    // Verify the correct topic was deleted
    const deletedTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicToDeleteId))
      .execute();

    expect(deletedTopic).toHaveLength(0);

    // Verify the other topic still exists
    const remainingTopic = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicToKeepId))
      .execute();

    expect(remainingTopic).toHaveLength(1);
    expect(remainingTopic[0].name).toBe('Topic to Keep');

    // Verify questions for deleted topic are gone
    const questionsForDeletedTopic = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicToDeleteId))
      .execute();

    expect(questionsForDeletedTopic).toHaveLength(0);

    // Verify questions for remaining topic still exist
    const questionsForRemainingTopic = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topicToKeepId))
      .execute();

    expect(questionsForRemainingTopic).toHaveLength(1);
    expect(questionsForRemainingTopic[0].text).toBe('Question for topic to keep');
  });
});
