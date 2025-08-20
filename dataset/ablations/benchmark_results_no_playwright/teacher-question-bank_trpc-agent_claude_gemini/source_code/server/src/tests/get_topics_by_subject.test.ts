import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subjectsTable, topicsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getTopicsBySubject } from '../handlers/get_topics_by_subject';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

describe('getTopicsBySubject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return topics for a specific subject', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topics for the subject
    await db.insert(topicsTable)
      .values([
        {
          name: 'Algebra',
          subject_id: subjectId
        },
        {
          name: 'Calculus',
          subject_id: subjectId
        }
      ])
      .execute();

    // Test the handler
    const result = await getTopicsBySubject({ id: subjectId });

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Algebra');
    expect(result[0].subject_id).toEqual(subjectId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].name).toEqual('Calculus');
    expect(result[1].subject_id).toEqual(subjectId);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for subject with no topics', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Physics'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Test the handler with subject that has no topics
    const result = await getTopicsBySubject({ id: subjectId });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent subject', async () => {
    // Test with non-existent subject ID
    const result = await getTopicsBySubject({ id: 999 });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only topics for the specified subject', async () => {
    // Create multiple subjects
    const subject1Result = await db.insert(subjectsTable)
      .values({
        name: 'Mathematics'
      })
      .returning()
      .execute();

    const subject2Result = await db.insert(subjectsTable)
      .values({
        name: 'Science'
      })
      .returning()
      .execute();

    const subject1Id = subject1Result[0].id;
    const subject2Id = subject2Result[0].id;

    // Create topics for both subjects
    await db.insert(topicsTable)
      .values([
        {
          name: 'Algebra',
          subject_id: subject1Id
        },
        {
          name: 'Biology',
          subject_id: subject2Id
        },
        {
          name: 'Chemistry',
          subject_id: subject2Id
        }
      ])
      .execute();

    // Test getting topics for subject 1
    const result1 = await getTopicsBySubject({ id: subject1Id });
    expect(result1).toHaveLength(1);
    expect(result1[0].name).toEqual('Algebra');
    expect(result1[0].subject_id).toEqual(subject1Id);

    // Test getting topics for subject 2
    const result2 = await getTopicsBySubject({ id: subject2Id });
    expect(result2).toHaveLength(2);
    
    const topicNames = result2.map(topic => topic.name).sort();
    expect(topicNames).toEqual(['Biology', 'Chemistry']);
    
    result2.forEach(topic => {
      expect(topic.subject_id).toEqual(subject2Id);
    });
  });

  it('should return topics with all required fields', async () => {
    // Create test subject
    const subjectResult = await db.insert(subjectsTable)
      .values({
        name: 'Computer Science'
      })
      .returning()
      .execute();

    const subjectId = subjectResult[0].id;

    // Create test topic
    await db.insert(topicsTable)
      .values({
        name: 'Data Structures',
        subject_id: subjectId
      })
      .execute();

    // Test the handler
    const result = await getTopicsBySubject({ id: subjectId });

    expect(result).toHaveLength(1);
    const topic = result[0];
    
    // Verify all required fields are present
    expect(topic.id).toBeDefined();
    expect(typeof topic.id).toBe('number');
    expect(topic.name).toBeDefined();
    expect(typeof topic.name).toBe('string');
    expect(topic.subject_id).toBeDefined();
    expect(typeof topic.subject_id).toBe('number');
    expect(topic.created_at).toBeDefined();
    expect(topic.created_at).toBeInstanceOf(Date);
  });
});
