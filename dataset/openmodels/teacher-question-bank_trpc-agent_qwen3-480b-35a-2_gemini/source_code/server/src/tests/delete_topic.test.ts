import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable, questionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteTopic } from '../handlers/delete_topic';

describe('deleteTopic', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a topic successfully when no questions are associated', async () => {
    // First create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Then create a topic
    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Algebra', 
        subject_id: subjectId 
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Delete the topic
    const result = await deleteTopic(topicId);

    expect(result).toBe(true);

    // Verify the topic was deleted
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicId))
      .execute();

    expect(topics).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent topic', async () => {
    const result = await deleteTopic(99999); // Non-existent ID
    expect(result).toBe(false);
  });

  it('should throw an error when trying to delete a topic with associated questions', async () => {
    // First create a subject
    const subjectResult = await db.insert(subjectsTable)
      .values({ name: 'Mathematics' })
      .returning()
      .execute();
    
    const subjectId = subjectResult[0].id;

    // Then create a topic
    const topicResult = await db.insert(topicsTable)
      .values({ 
        name: 'Algebra', 
        subject_id: subjectId 
      })
      .returning()
      .execute();

    const topicId = topicResult[0].id;

    // Create a question associated with this topic
    await db.insert(questionsTable)
      .values({
        text: 'What is 2+2?',
        type: 'Multiple Choice',
        correct_answer: '4',
        subject_id: subjectId,
        topic_id: topicId
      })
      .execute();

    // Try to delete the topic - should throw an error
    await expect(deleteTopic(topicId)).rejects.toThrow(/Cannot delete topic with associated questions/);

    // Verify the topic still exists
    const topics = await db.select()
      .from(topicsTable)
      .where(eq(topicsTable.id, topicId))
      .execute();

    expect(topics).toHaveLength(1);
  });
});
