import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { deleteTopic } from '../handlers/delete_topic';
import { eq } from 'drizzle-orm';

describe('deleteTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing topic successfully', async () => {
    // Create a subject first
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A test subject'
      })
      .returning()
      .execute();

    // Create a topic
    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A test topic',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Delete the topic
    const result = await deleteTopic(topic.id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify topic is no longer in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(topics).toHaveLength(0);
  });

  it('should return false for non-existent topic', async () => {
    const nonExistentId = 99999;

    const result = await deleteTopic(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should cascade delete related questions', async () => {
    // Create a subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A test subject'
      })
      .returning()
      .execute();

    // Create a topic
    const [topic] = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A test topic',
        subject_id: subject.id
      })
      .returning()
      .execute();

    // Create questions related to this topic
    const questionData = [
      {
        question_text: 'Question 1',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'multiple-choice' as const,
        answer: 'A'
      },
      {
        question_text: 'Question 2',
        subject_id: subject.id,
        topic_id: topic.id,
        type: 'open-ended' as const,
        answer: 'Answer 2'
      }
    ];

    const questions = await db.insert(questionsTable)
      .values(questionData)
      .returning()
      .execute();

    expect(questions).toHaveLength(2);

    // Delete the topic
    const result = await deleteTopic(topic.id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify topic is deleted
    const remainingTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic.id))
      .execute();

    expect(remainingTopics).toHaveLength(0);

    // Verify related questions are also deleted (cascading)
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topic.id))
      .execute();

    expect(remainingQuestions).toHaveLength(0);
  });

  it('should only delete the specified topic', async () => {
    // Create a subject
    const [subject] = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A test subject'
      })
      .returning()
      .execute();

    // Create multiple topics
    const topicData = [
      {
        name: 'Topic to Delete',
        description: 'This will be deleted',
        subject_id: subject.id
      },
      {
        name: 'Topic to Keep',
        description: 'This should remain',
        subject_id: subject.id
      }
    ];

    const topics = await db.insert(topicsTable)
      .values(topicData)
      .returning()
      .execute();

    const topicToDelete = topics[0];
    const topicToKeep = topics[1];

    // Delete only the first topic
    const result = await deleteTopic(topicToDelete.id);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify the deleted topic is gone
    const deletedTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicToDelete.id))
      .execute();

    expect(deletedTopics).toHaveLength(0);

    // Verify the other topic still exists
    const remainingTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicToKeep.id))
      .execute();

    expect(remainingTopics).toHaveLength(1);
    expect(remainingTopics[0].name).toBe('Topic to Keep');
  });
});
