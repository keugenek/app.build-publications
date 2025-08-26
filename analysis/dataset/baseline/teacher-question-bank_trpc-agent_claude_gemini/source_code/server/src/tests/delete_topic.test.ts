import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteTopic } from '../handlers/delete_topic';
import { eq } from 'drizzle-orm';

describe('deleteTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing topic', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create topic to delete
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    const input: DeleteInput = { id: topic[0].id };

    // Delete the topic
    const result = await deleteTopic(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify topic no longer exists in database
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic[0].id))
      .execute();

    expect(topics).toHaveLength(0);
  });

  it('should return false when topic does not exist', async () => {
    const input: DeleteInput = { id: 999 };

    // Try to delete non-existent topic
    const result = await deleteTopic(input);

    // Should return success: false since no rows were deleted
    expect(result.success).toBe(false);
  });

  it('should cascade delete related questions', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create topic
    const topic = await db.insert(topicsTable)
      .values({
        name: 'Test Topic',
        description: 'A topic for testing',
        subject_id: subject[0].id
      })
      .returning()
      .execute();

    // Create related questions
    await db.insert(questionsTable)
      .values([
        {
          question_text: 'Test Question 1',
          option_a: 'Option A1',
          option_b: 'Option B1',
          option_c: 'Option C1',
          option_d: 'Option D1',
          correct_answer: 'A',
          explanation: 'Test explanation 1',
          difficulty_level: 'easy',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        },
        {
          question_text: 'Test Question 2',
          option_a: 'Option A2',
          option_b: 'Option B2',
          option_c: 'Option C2',
          option_d: 'Option D2',
          correct_answer: 'B',
          explanation: 'Test explanation 2',
          difficulty_level: 'medium',
          subject_id: subject[0].id,
          topic_id: topic[0].id
        }
      ])
      .execute();

    // Verify questions exist before deletion
    const questionsBeforeDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topic[0].id))
      .execute();

    expect(questionsBeforeDelete).toHaveLength(2);

    const input: DeleteInput = { id: topic[0].id };

    // Delete the topic
    const result = await deleteTopic(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify topic no longer exists
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topic[0].id))
      .execute();

    expect(topics).toHaveLength(0);

    // Verify related questions were cascade deleted
    const questionsAfterDelete = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topic[0].id))
      .execute();

    expect(questionsAfterDelete).toHaveLength(0);
  });

  it('should not affect questions from other topics', async () => {
    // Create prerequisite subject
    const subject = await db.insert(subjectsTable)
      .values({
        name: 'Test Subject',
        description: 'A subject for testing'
      })
      .returning()
      .execute();

    // Create two topics
    const topics = await db.insert(topicsTable)
      .values([
        {
          name: 'Topic to Delete',
          description: 'This topic will be deleted',
          subject_id: subject[0].id
        },
        {
          name: 'Topic to Keep',
          description: 'This topic should remain',
          subject_id: subject[0].id
        }
      ])
      .returning()
      .execute();

    // Create questions for both topics
    await db.insert(questionsTable)
      .values([
        // Question for topic to delete
        {
          question_text: 'Question for deletion',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'A',
          explanation: 'Will be deleted',
          difficulty_level: 'easy',
          subject_id: subject[0].id,
          topic_id: topics[0].id
        },
        // Question for topic to keep
        {
          question_text: 'Question to keep',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'B',
          explanation: 'Should remain',
          difficulty_level: 'medium',
          subject_id: subject[0].id,
          topic_id: topics[1].id
        }
      ])
      .execute();

    const input: DeleteInput = { id: topics[0].id };

    // Delete the first topic
    const result = await deleteTopic(input);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify first topic is deleted
    const deletedTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topics[0].id))
      .execute();

    expect(deletedTopics).toHaveLength(0);

    // Verify second topic still exists
    const remainingTopics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topics[1].id))
      .execute();

    expect(remainingTopics).toHaveLength(1);

    // Verify question from deleted topic is gone
    const deletedQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topics[0].id))
      .execute();

    expect(deletedQuestions).toHaveLength(0);

    // Verify question from remaining topic still exists
    const remainingQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.topic_id, topics[1].id))
      .execute();

    expect(remainingQuestions).toHaveLength(1);
    expect(remainingQuestions[0].question_text).toBe('Question to keep');
  });
});
